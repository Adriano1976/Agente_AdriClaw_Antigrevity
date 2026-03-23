#!/usr/bin/env python3
"""
audit_skill.py
==============
Scanner de segurança para skills de IA. Realiza análise estática de todos
os arquivos de uma skill e produz um relatório de vulnerabilidades.

Uso:
    python scripts/audit_skill.py <caminho_da_skill> --map
    python scripts/audit_skill.py <caminho_da_skill> --read-all
    python scripts/audit_skill.py <caminho_da_skill> --scan-all
    python scripts/audit_skill.py <caminho_da_skill> --scan-all --output relatorio.md

Dependências: nenhuma além da stdlib Python 3.9+
"""

import sys
import os
import re
import json
import argparse
import hashlib
from pathlib import Path
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional


# ---------------------------------------------------------------------------
# Estruturas de dados
# ---------------------------------------------------------------------------

@dataclass
class Finding:
    id: str
    title: str
    severity: str          # CRITICAL | HIGH | MEDIUM | LOW | INFO
    category: str
    vector_code: str
    file: str
    line: Optional[int]
    evidence: str
    description: str
    impact: str
    recommendation: str

    @property
    def severity_emoji(self) -> str:
        return {
            "CRITICAL": "🔴",
            "HIGH":     "🟠",
            "MEDIUM":   "🟡",
            "LOW":      "🔵",
            "INFO":     "⚪",
        }.get(self.severity, "❓")

    @property
    def severity_points(self) -> int:
        return {"CRITICAL": 40, "HIGH": 20, "MEDIUM": 10, "LOW": 3, "INFO": 0}.get(self.severity, 0)


@dataclass
class AuditResult:
    skill_name: str
    skill_path: str
    audit_date: str
    files_inspected: list[str] = field(default_factory=list)
    findings: list[Finding] = field(default_factory=list)

    def score(self) -> int:
        counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0}
        caps = {"CRITICAL": 3, "HIGH": 5, "MEDIUM": 8}
        pts = 0
        for f in self.findings:
            if f.severity in caps:
                if counts.get(f.severity, 0) < caps[f.severity]:
                    pts += f.severity_points
                    counts[f.severity] = counts.get(f.severity, 0) + 1
            else:
                pts += f.severity_points
        return min(100, round((pts / 300) * 100))

    def classification(self) -> tuple[str, str]:
        s = self.score()
        if s <= 15:  return ("✅", "Seguro")
        if s <= 35:  return ("🟡", "Atenção")
        if s <= 60:  return ("🟠", "Risco Significativo")
        if s <= 85:  return ("🔴", "Risco Alto")
        return ("⛔", "Crítico — Não Use")

    def counts(self) -> dict:
        c = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        for f in self.findings:
            c[f.severity] = c.get(f.severity, 0) + 1
        return c


# ---------------------------------------------------------------------------
# Mapeamento da skill
# ---------------------------------------------------------------------------

SKIP_EXTENSIONS = {".pyc", ".pyo", ".egg-info", ".DS_Store"}
SKIP_DIRS = {"__pycache__", ".git", "node_modules", ".venv", "venv"}

def map_skill(skill_path: Path) -> list[Path]:
    """Retorna todos os arquivos relevantes da skill."""
    files = []
    for p in sorted(skill_path.rglob("*")):
        if p.is_file():
            if any(part in SKIP_DIRS for part in p.parts):
                continue
            if p.suffix in SKIP_EXTENSIONS:
                continue
            files.append(p)
    return files


def print_tree(skill_path: Path, files: list[Path]) -> str:
    lines = [str(skill_path.name) + "/"]
    for f in files:
        rel = f.relative_to(skill_path)
        depth = len(rel.parts) - 1
        indent = "    " * depth + "├── "
        lines.append(indent + f.name)
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Detecção de padrões
# ---------------------------------------------------------------------------

# Patterns for secrets (regex, case-insensitive)
SECRET_PATTERNS = [
    (r'sk-[a-zA-Z0-9\-_]{20,}',                       "Possível chave Anthropic/OpenAI"),
    (r'ghp_[a-zA-Z0-9]{36}',                           "Possível token GitHub"),
    (r'gho_[a-zA-Z0-9]{36}',                           "Possível token OAuth GitHub"),
    (r'Bearer\s+[a-zA-Z0-9\-._~+/]{20,}=*',           "Bearer token hardcoded"),
    (r'(?i)password\s*[=:]\s*["\'][^"\']{6,}["\']',   "Senha hardcoded"),
    (r'(?i)api_?key\s*[=:]\s*["\'][^"\']{10,}["\']',  "API key hardcoded"),
    (r'(?i)secret\s*[=:]\s*["\'][^"\']{8,}["\']',     "Secret hardcoded"),
    (r'(?i)token\s*[=:]\s*["\'][^"\']{10,}["\']',     "Token hardcoded"),
    (r'[a-f0-9]{32,}(?=[^a-f0-9]|$)',                  "Hash/token hexadecimal longo"),
]

# Patterns for unsafe code execution
CODE_EXEC_PATTERNS = [
    (r'\beval\s*\(',                                   "CE-01", "CRITICAL", "eval() detectado"),
    (r'\bexec\s*\(',                                   "CE-01", "CRITICAL", "exec() detectado"),
    (r'subprocess\.[a-z_]+\([^)]*shell\s*=\s*True',   "CE-02", "CRITICAL", "subprocess com shell=True"),
    (r'os\.system\s*\(',                               "CE-02", "HIGH",     "os.system() — verificar se input é externo"),
    (r'pickle\.loads?\s*\(',                           "CE-04", "CRITICAL", "pickle.loads() — deserialização insegura"),
    (r'yaml\.load\s*\([^)]*\)',                        "CE-04", "HIGH",     "yaml.load() sem SafeLoader especificado"),
    (r'__import__\s*\(',                               "CE-07", "HIGH",     "__import__() dinâmico detectado"),
    (r'importlib\.import_module\s*\(',                 "CE-07", "MEDIUM",   "importlib.import_module() — verificar se dinâmico"),
    (r'open\s*\(\s*f["\']',                            "CE-03", "MEDIUM",   "open() com f-string — verificar path traversal"),
    (r'open\s*\(\s*[^"\'(]+\+',                       "CE-03", "MEDIUM",   "open() com concatenação — verificar path traversal"),
]

# Prompt injection patterns in markdown/text files
PROMPT_INJECTION_PATTERNS = [
    (r'(?i)(execute|siga|realize|processe)\s+(as\s+)?(instruções|passos|comandos)\s+(no|do|contidas?\s+no)\s+(arquivo|documento|texto)',
     "PI-04", "HIGH", "Instrução para seguir comandos em arquivo externo"),
    (r'(?i)ignore\s+(instruções|instrução|regras)\s+(anteriores?|acima|prévias?)',
     "PI-06", "CRITICAL", "Instrução para ignorar regras anteriores"),
    (r'(?i)(explique|mostre|revele|divulgue)\s+(seu|suas|os)\s+(sistema\s+prompt|instruções\s+internas?|regras\s+internas?)',
     "ID-01", "HIGH", "Instrução que pode expor system prompt"),
    (r'(?i)seja\s+(totalmente\s+)?(transparente|aberto)\s+sobre\s+(como\s+você\s+funciona|suas\s+instruções)',
     "ID-01", "MEDIUM", "Instrução de transparência sobre funcionamento interno"),
    (r'(?i)atue\s+como|finja\s+ser|roleplay\s+as|act\s+as\s+if\s+you\s+(are|have\s+no)',
     "PI-06", "MEDIUM", "Possível redefinição de identidade do modelo"),
    (r'(?i)(contorne|bypasse|ignore)\s+(restrições|limitações|bloqueios)',
     "PE-03", "HIGH", "Instrução para contornar restrições"),
]

# Absolute path patterns (may reveal internal structure)
ABS_PATH_PATTERN = re.compile(
    r'(?<![a-zA-Z0-9_])'   # not part of a word
    r'(/(?:home|Users|var|opt|srv|root|mnt)/[^\s\'"`,]{5,})',
    re.IGNORECASE
)

# Personal data patterns
PERSONAL_DATA_PATTERNS = [
    (r'\b\d{3}\.\d{3}\.\d{3}-\d{2}\b',             "CPF"),
    (r'\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b',       "CNPJ"),
    (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', "Email"),
    (r'\(\d{2}\)\s*\d{4,5}-\d{4}',                  "Telefone BR"),
]


# ---------------------------------------------------------------------------
# Scanners por tipo de arquivo
# ---------------------------------------------------------------------------

def scan_text_for_secrets(content: str, filepath: str) -> list[Finding]:
    findings = []
    lines = content.splitlines()
    for pattern_str, label in SECRET_PATTERNS:
        for i, line in enumerate(lines, 1):
            if re.search(pattern_str, line, re.IGNORECASE):
                # Mascara o valor encontrado para não vazar no próprio relatório
                masked = re.sub(pattern_str, "[REDACTED]", line.strip(), flags=re.IGNORECASE)
                findings.append(Finding(
                    id=f"ID-03-{len(findings)+1:03d}",
                    title=f"{label} detectado",
                    severity="CRITICAL",
                    category="Information Disclosure",
                    vector_code="ID-03",
                    file=filepath,
                    line=i,
                    evidence=masked,
                    description=f"{label} parece estar hardcoded no arquivo. Credenciais não devem jamais ser incluídas em arquivos de skill.",
                    impact="Qualquer pessoa com acesso à skill pode obter e usar a credencial para acessar o serviço correspondente.",
                    recommendation="Remova a credencial e use variável de ambiente: `os.environ.get('NOME_DA_VAR')`. Invalide a credencial exposta imediatamente.",
                ))
    return findings


def scan_python_file(content: str, filepath: str) -> list[Finding]:
    findings = []
    lines = content.splitlines()

    # Check code execution patterns
    for pattern_str, vector, severity, label in CODE_EXEC_PATTERNS:
        for i, line in enumerate(lines, 1):
            if re.search(pattern_str, line, re.IGNORECASE):
                findings.append(Finding(
                    id=f"{vector}-{len(findings)+1:03d}",
                    title=label,
                    severity=severity,
                    category="Code Execution",
                    vector_code=vector,
                    file=filepath,
                    line=i,
                    evidence=line.strip(),
                    description=f"Uso de `{label.split()[0]}` detectado. Se dados externos (input do usuário, arquivos, APIs) chegam a este ponto sem sanitização adequada, pode permitir execução de código arbitrário.",
                    impact="Execução de código arbitrário no sistema onde a skill roda, potencialmente com os mesmos privilégios do processo.",
                    recommendation=f"Veja `references/secure_patterns.md` para alternativas seguras ao padrão detectado.",
                ))

    # Check for subprocess without shell validation
    for i, line in enumerate(lines, 1):
        if "subprocess" in line and "shell=False" not in line and "shell =" not in line:
            if re.search(r'subprocess\.(run|Popen|call|check_output)', line):
                findings.append(Finding(
                    id=f"CE-02-{len(findings)+1:03d}",
                    title="subprocess sem shell=False explícito",
                    severity="LOW",
                    category="Code Execution",
                    vector_code="CE-02",
                    file=filepath,
                    line=i,
                    evidence=line.strip(),
                    description="Chamada subprocess sem `shell=False` explícito. Embora o padrão seja False, é boa prática declarar explicitamente para evitar regressões.",
                    impact="Baixo — pode se tornar alto se o padrão for alterado inadvertidamente.",
                    recommendation="Adicione `shell=False` explicitamente a todas as chamadas subprocess.",
                ))
            break  # Only report once per file for this

    # Check for requirements / imports without pinning
    if filepath.endswith("requirements.txt") or filepath.endswith("requirements-dev.txt"):
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                if "==" not in stripped and ">=" not in stripped and "~=" not in stripped:
                    findings.append(Finding(
                        id=f"SC-01-{len(findings)+1:03d}",
                        title=f"Dependência sem versão fixada: {stripped}",
                        severity="MEDIUM",
                        category="Supply Chain",
                        vector_code="SC-01",
                        file=filepath,
                        line=i,
                        evidence=stripped,
                        description="Pacote sem versão pinada pode instalar versões futuras comprometidas automaticamente.",
                        impact="Risco de supply chain: uma versão maliciosa publicada no PyPI seria instalada na próxima execução.",
                        recommendation=f"Fixe a versão: `{stripped}==X.Y.Z`",
                    ))

    # Check for absolute paths
    for i, line in enumerate(lines, 1):
        matches = ABS_PATH_PATTERN.findall(line)
        for match in matches:
            if not match.startswith("/home/claude"):  # Expected working dir
                findings.append(Finding(
                    id=f"ID-02-{len(findings)+1:03d}",
                    title="Caminho absoluto interno exposto",
                    severity="MEDIUM",
                    category="Information Disclosure",
                    vector_code="ID-02",
                    file=filepath,
                    line=i,
                    evidence=line.strip(),
                    description=f"O caminho `{match}` pode revelar estrutura interna do sistema ou ambiente de desenvolvimento.",
                    impact="Exposição de estrutura de diretórios, possivelmente revelando organização interna do projeto.",
                    recommendation="Use caminhos relativos ou variáveis de ambiente para caminhos de sistema.",
                ))

    # Check for personal data
    for i, line in enumerate(lines, 1):
        for pattern_str, label in PERSONAL_DATA_PATTERNS:
            if re.search(pattern_str, line):
                findings.append(Finding(
                    id=f"ID-04-{len(findings)+1:03d}",
                    title=f"Dado pessoal ({label}) em código",
                    severity="HIGH",
                    category="Information Disclosure",
                    vector_code="ID-04",
                    file=filepath,
                    line=i,
                    evidence=re.sub(pattern_str, f"[{label} REDACTED]", line.strip()),
                    description=f"Dado pessoal real ({label}) encontrado em código. Viola LGPD e boas práticas.",
                    impact="Exposição de dado pessoal de titular específico. Pode gerar responsabilidade legal.",
                    recommendation="Substitua por dado fictício ou placeholder sem valor real.",
                ))

    return findings


def scan_markdown_file(content: str, filepath: str) -> list[Finding]:
    findings = []

    # Check prompt injection patterns
    for pattern_str, vector, severity, label in PROMPT_INJECTION_PATTERNS:
        matches = list(re.finditer(pattern_str, content, re.IGNORECASE | re.MULTILINE))
        for m in matches:
            # Find line number
            line_num = content[:m.start()].count("\n") + 1
            findings.append(Finding(
                id=f"{vector}-{len(findings)+1:03d}",
                title=label,
                severity=severity,
                category="Prompt Injection" if vector.startswith("PI") else "Information Disclosure",
                vector_code=vector,
                file=filepath,
                line=line_num,
                evidence=m.group(0)[:200],
                description=f"Instrução potencialmente insegura detectada: '{label}'. Pode ser explorada por conteúdo malicioso em arquivos externos ou input do usuário.",
                impact="Sequestro de instrução: conteúdo externo pode subverter o comportamento da skill e executar ações não autorizadas.",
                recommendation="Reformule a instrução para tratar conteúdo externo como dados opacos, nunca como instruções. Adicione delimitadores explícitos.",
            ))

    # Check absolute paths in markdown
    matches = ABS_PATH_PATTERN.findall(content)
    seen = set()
    for match in matches:
        if match not in seen and not match.startswith("/home/claude"):
            seen.add(match)
            line_num = content[:content.find(match)].count("\n") + 1
            findings.append(Finding(
                id=f"ID-02-{len(findings)+1:03d}",
                title="Caminho absoluto interno em markdown",
                severity="LOW",
                category="Information Disclosure",
                vector_code="ID-02",
                file=filepath,
                line=line_num,
                evidence=match,
                description="Caminho absoluto encontrado em arquivo markdown pode revelar estrutura interna.",
                impact="Exposição de estrutura de diretórios do ambiente de desenvolvimento.",
                recommendation="Substitua por caminho relativo ou placeholder genérico.",
            ))

    # Check secrets in markdown too
    findings.extend(scan_text_for_secrets(content, filepath))

    # Check personal data
    for i, line in enumerate(content.splitlines(), 1):
        for pattern_str, label in PERSONAL_DATA_PATTERNS:
            if re.search(pattern_str, line):
                findings.append(Finding(
                    id=f"ID-04-{len(findings)+1:03d}",
                    title=f"Dado pessoal ({label}) em markdown",
                    severity="MEDIUM",
                    category="Information Disclosure",
                    vector_code="ID-04",
                    file=filepath,
                    line=i,
                    evidence=re.sub(pattern_str, f"[{label} REDACTED]", line.strip()),
                    description=f"Dado pessoal ({label}) em arquivo de documentação ou template.",
                    impact="Exposição de dado pessoal real em arquivo que pode ser distribuído.",
                    recommendation="Substitua por dado fictício claramente identificável como exemplo.",
                ))

    return findings


# ---------------------------------------------------------------------------
# Dispatcher principal
# ---------------------------------------------------------------------------

def scan_file(filepath: Path, skill_path: Path) -> list[Finding]:
    rel = str(filepath.relative_to(skill_path))
    try:
        content = filepath.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return []

    ext = filepath.suffix.lower()
    name = filepath.name.lower()

    if ext in (".py",) or name in ("requirements.txt", "requirements-dev.txt"):
        findings = scan_python_file(content, rel)
        findings.extend(scan_text_for_secrets(content, rel))
        return findings
    elif ext in (".md", ".txt", ".html", ".htm", ".j2", ".jinja"):
        return scan_markdown_file(content, rel)
    elif ext in (".json", ".yaml", ".yml", ".toml", ".ini", ".env", ".cfg"):
        findings = scan_text_for_secrets(content, rel)
        findings.extend(scan_markdown_file(content, rel))  # Also check for paths etc.
        return findings
    elif ext in (".sh", ".bash", ".zsh"):
        # Basic shell script checks
        findings = scan_text_for_secrets(content, rel)
        lines = content.splitlines()
        for i, line in enumerate(lines, 1):
            if re.search(r'\beval\b', line) and not line.strip().startswith("#"):
                findings.append(Finding(
                    id=f"CE-01-sh-{i:03d}",
                    title="eval em script shell",
                    severity="HIGH",
                    category="Code Execution",
                    vector_code="CE-01",
                    file=rel,
                    line=i,
                    evidence=line.strip(),
                    description="eval em shell pode executar código arbitrário se receber input externo.",
                    impact="Execução de comandos arbitrários no sistema.",
                    recommendation="Evite eval em shell; se necessário, sanitize rigorosamente o input.",
                ))
        return findings
    else:
        # Unknown type — check for secrets only
        return scan_text_for_secrets(content, rel)


# ---------------------------------------------------------------------------
# Geração de relatório Markdown
# ---------------------------------------------------------------------------

def generate_markdown_report(result: AuditResult, template_path: Optional[Path] = None) -> str:
    counts = result.counts()
    emoji, classification = result.classification()
    score = result.score()
    date = result.audit_date

    # Verdict text
    n_crit = counts["CRITICAL"]
    n_high = counts["HIGH"]
    if n_crit > 0:
        verdict = (
            f"A skill apresenta {n_crit} achado(s) CRÍTICO — uso imediato em produção não é recomendado. "
            f"Existem também {n_high} achado(s) de severidade ALTA. "
            "Corrija os problemas críticos e altos antes de qualquer implantação."
        )
    elif n_high > 0:
        verdict = (
            f"A skill não possui achados críticos, mas apresenta {n_high} achado(s) de severidade ALTA "
            f"e {counts['MEDIUM']} de severidade MÉDIA. "
            "Corrija os achados altos antes de uso em produção."
        )
    elif counts["MEDIUM"] > 0:
        verdict = (
            f"A skill apresenta apenas achados de severidade MÉDIA ({counts['MEDIUM']}) e BAIXA ({counts['LOW']}). "
            "Pode ser usada com cautela após revisar e aplicar as recomendações."
        )
    else:
        verdict = (
            "Nenhum achado de severidade significativa encontrado. "
            "A skill segue boas práticas de segurança e pode ser usada com confiança. "
            "Revise os itens informativos para oportunidades de melhoria."
        )

    # Build findings section
    findings_md = ""
    counter = 1
    for severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]:
        for f in [x for x in result.findings if x.severity == severity]:
            findings_md += f"""
---

### [{f.id}] {f.title}

| Campo | Valor |
|---|---|
| **Severidade** | {f.severity_emoji} {f.severity} |
| **Categoria** | {f.category} |
| **Vetor** | `{f.vector_code}` |
| **Arquivo** | `{f.file}` |
| **Linha** | {f.line if f.line else "N/A"} |

**Evidência:**
```
{f.evidence}
```

**Descrição:**  
{f.description}

**Impacto potencial:**  
{f.impact}

**Recomendação:**  
{f.recommendation}

"""
            counter += 1

    if not findings_md:
        findings_md = "\n*Nenhum achado encontrado.* ✅\n"

    # Build file tree
    tree_lines = [result.skill_name + "/"]
    for fp in result.files_inspected:
        depth = fp.count(os.sep)
        indent = "    " * depth + "├── "
        tree_lines.append(indent + os.path.basename(fp))
    file_tree = "\n".join(tree_lines)

    # Positives — anything NOT flagged
    flagged_files = {f.file for f in result.findings}
    all_files = set(result.files_inspected)
    clean_files = all_files - flagged_files
    positives = ""
    if clean_files:
        positives = "\n".join(f"- `{fp}` — sem achados de segurança" for fp in sorted(clean_files))
    else:
        positives = "- Todos os arquivos apresentaram pelo menos um achado."

    report = f"""# 🔒 Relatório de Auditoria de Segurança — {result.skill_name}

**Data da auditoria:** {date}  
**Auditado por:** Skill Security Auditor v1.0  
**Caminho auditado:** `{result.skill_path}`  
**Arquivos inspecionados:** {len(result.files_inspected)}

---

## 📊 Sumário Executivo

| Métrica | Valor |
|---|---|
| **Score de Risco Global** | {score}/100 |
| **Classificação** | {emoji} {classification} |
| **Achados Críticos** 🔴 | {counts["CRITICAL"]} |
| **Achados Altos** 🟠 | {counts["HIGH"]} |
| **Achados Médios** 🟡 | {counts["MEDIUM"]} |
| **Achados Baixos** 🔵 | {counts["LOW"]} |
| **Informativos** ⚪ | {counts["INFO"]} |

### Veredicto

> {verdict}

---

## 🗂️ Arquivos Inspecionados

```
{file_tree}
```

---

## 🔍 Achados Detalhados
{findings_md}

---

## ✅ Pontos Positivos

{positives}

---

## 📋 Plano de Remediação

"""

    # Remediation plan
    for severity, label in [("CRITICAL", "Imediato (antes de qualquer uso)"), ("HIGH", "Antes de Produção"), ("MEDIUM", "Próximo Ciclo"), ("LOW", "Backlog")]:
        sev_findings = [f for f in result.findings if f.severity == severity]
        if sev_findings:
            report += f"### Prioridade — {label}\n\n"
            for f in sev_findings:
                report += f"- [ ] **[{f.id}]** {f.recommendation}\n"
            report += "\n"

    report += """
---

> 🛡️ *Relatório gerado pela skill `skill-security-auditor`. Esta análise cobre padrões conhecidos de vulnerabilidade em skills de IA, mas não substitui uma revisão de segurança profissional para ambientes de alto risco.*
"""
    return report


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Auditor de segurança para skills de IA"
    )
    parser.add_argument("skill_path", help="Caminho para a pasta da skill")
    parser.add_argument("--map", action="store_true", help="Apenas mapear arquivos da skill")
    parser.add_argument("--read-all", action="store_true", help="Listar conteúdo de todos os arquivos")
    parser.add_argument("--scan-all", action="store_true", help="Executar scan completo de segurança")
    parser.add_argument("--output", "-o", help="Salvar relatório neste arquivo .md")
    parser.add_argument("--json", action="store_true", help="Output em JSON além do markdown")
    args = parser.parse_args()

    skill_path = Path(args.skill_path).resolve()
    if not skill_path.exists() or not skill_path.is_dir():
        print(f"❌ Diretório não encontrado: {skill_path}", file=sys.stderr)
        sys.exit(1)

    skill_name = skill_path.name
    files = map_skill(skill_path)

    if args.map or args.read_all:
        print(f"\n📂 Skill: {skill_name}")
        print(f"   Localização: {skill_path}")
        print(f"   Arquivos encontrados: {len(files)}\n")
        print(print_tree(skill_path, files))
        if not args.scan_all:
            return

    if args.read_all:
        for f in files:
            rel = f.relative_to(skill_path)
            print(f"\n{'='*60}")
            print(f"📄 {rel}")
            print('='*60)
            try:
                print(f.read_text(encoding="utf-8", errors="replace"))
            except Exception as e:
                print(f"[Erro ao ler: {e}]")
        if not args.scan_all:
            return

    if args.scan_all:
        print(f"\n🔍 Iniciando auditoria de segurança: {skill_name}", file=sys.stderr)
        print(f"   {len(files)} arquivo(s) para analisar...\n", file=sys.stderr)

        result = AuditResult(
            skill_name=skill_name,
            skill_path=str(skill_path),
            audit_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            files_inspected=[str(f.relative_to(skill_path)) for f in files],
        )

        all_findings = []
        for f in files:
            rel = str(f.relative_to(skill_path))
            print(f"   Analisando: {rel}", file=sys.stderr)
            findings = scan_file(f, skill_path)
            all_findings.extend(findings)

        # Deduplicate by (vector, file, line)
        seen = set()
        for f in all_findings:
            key = (f.vector_code, f.file, f.line, f.evidence[:50])
            if key not in seen:
                seen.add(key)
                result.findings.append(f)

        counts = result.counts()
        score = result.score()
        emoji, classification = result.classification()

        print(f"\n{'='*50}", file=sys.stderr)
        print(f"📊 RESULTADO DA AUDITORIA", file=sys.stderr)
        print(f"   Score: {score}/100  {emoji} {classification}", file=sys.stderr)
        print(f"   🔴 Crítico: {counts['CRITICAL']}  🟠 Alto: {counts['HIGH']}  🟡 Médio: {counts['MEDIUM']}  🔵 Baixo: {counts['LOW']}", file=sys.stderr)
        print(f"{'='*50}\n", file=sys.stderr)

        # Generate report
        report_md = generate_markdown_report(result)

        if args.output:
            output_path = Path(args.output)
            output_path.write_text(report_md, encoding="utf-8")
            print(f"✅ Relatório salvo em: {output_path}", file=sys.stderr)
        else:
            # Default output path
            default_name = f"security-report-{skill_name}-{datetime.now().strftime('%Y%m%d')}.md"
            default_path = skill_path.parent / default_name
            default_path.write_text(report_md, encoding="utf-8")
            print(f"✅ Relatório salvo em: {default_path}", file=sys.stderr)
            print(str(default_path))  # stdout for capture

        if args.json:
            json_path = (Path(args.output).with_suffix(".json") if args.output
                         else skill_path.parent / f"security-report-{skill_name}.json")
            json_data = {
                "skill_name": result.skill_name,
                "audit_date": result.audit_date,
                "score": score,
                "classification": classification,
                "counts": counts,
                "findings": [asdict(f) for f in result.findings],
            }
            json_path.write_text(json.dumps(json_data, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"✅ JSON salvo em: {json_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
