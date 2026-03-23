#!/usr/bin/env python3
"""
analyze_document.py
====================
Script auxiliar para extrair texto de documentos jurídicos em formato
PDF ou DOCX e prepará-los para análise pelo Legal Document Explainer.

Uso:
    python scripts/analyze_document.py <caminho_do_arquivo>
    python scripts/analyze_document.py <caminho_do_arquivo> --output texto_extraido.txt
    python scripts/analyze_document.py <caminho_do_arquivo> --stats

Dependências:
    pip install pdfplumber python-docx chardet

Quando usar este script:
    - Quando o usuário enviar um arquivo PDF ou DOCX via bash_tool
    - Quando o texto copiado diretamente estiver com encoding quebrado
    - Quando o documento for muito longo e precisar de estatísticas antes de analisar
"""

import sys
import os
import argparse
from pathlib import Path


def extract_from_pdf(filepath: str) -> str:
    """Extrai texto de PDF usando pdfplumber (preserva estrutura de tabelas)."""
    try:
        import pdfplumber
    except ImportError:
        print("❌ pdfplumber não instalado. Execute: pip install pdfplumber", file=sys.stderr)
        sys.exit(1)

    text_parts = []
    with pdfplumber.open(filepath) as pdf:
        total_pages = len(pdf.pages)
        print(f"📄 PDF com {total_pages} página(s) detectado.", file=sys.stderr)

        for i, page in enumerate(pdf.pages, 1):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"\n--- Página {i} ---\n{page_text}")

            # Extrai tabelas se houver
            tables = page.extract_tables()
            for table in tables:
                table_text = "\n[TABELA]\n"
                for row in table:
                    if row:
                        table_text += " | ".join(str(cell or "").strip() for cell in row) + "\n"
                text_parts.append(table_text)

    return "\n".join(text_parts)


def extract_from_docx(filepath: str) -> str:
    """Extrai texto de DOCX preservando parágrafos e tabelas."""
    try:
        from docx import Document
    except ImportError:
        print("❌ python-docx não instalado. Execute: pip install python-docx", file=sys.stderr)
        sys.exit(1)

    doc = Document(filepath)
    text_parts = []

    for element in doc.element.body:
        tag = element.tag.split("}")[-1] if "}" in element.tag else element.tag

        if tag == "p":
            # Parágrafo normal
            para_text = "".join(node.text or "" for node in element.iter() if node.tag.endswith("}t"))
            if para_text.strip():
                text_parts.append(para_text)

        elif tag == "tbl":
            # Tabela
            text_parts.append("\n[TABELA]")
            for row_el in element.iter():
                if row_el.tag.endswith("}tr"):
                    row_cells = []
                    for cell_el in row_el:
                        if cell_el.tag.endswith("}tc"):
                            cell_text = "".join(n.text or "" for n in cell_el.iter() if n.tag.endswith("}t"))
                            row_cells.append(cell_text.strip())
                    if any(row_cells):
                        text_parts.append(" | ".join(row_cells))

    return "\n".join(text_parts)


def extract_from_txt(filepath: str) -> str:
    """Lê arquivo de texto simples com detecção automática de encoding."""
    try:
        import chardet
        with open(filepath, "rb") as f:
            raw = f.read()
        detected = chardet.detect(raw)
        encoding = detected.get("encoding") or "utf-8"
    except ImportError:
        encoding = "utf-8"

    with open(filepath, "r", encoding=encoding, errors="replace") as f:
        return f.read()


def compute_stats(text: str) -> dict:
    """Calcula estatísticas básicas do documento."""
    words = text.split()
    lines = text.splitlines()
    chars = len(text)

    # Estimativa de tempo de leitura (200 palavras/minuto = leitura média)
    read_minutes = len(words) / 200

    # Detecta idioma provável (heurística simples)
    pt_markers = ["contrato", "cláusula", "parte", "valor", "rescisão", "prazo", "obrigações"]
    en_markers = ["contract", "clause", "party", "value", "termination", "term", "obligations"]
    pt_count = sum(text.lower().count(m) for m in pt_markers)
    en_count = sum(text.lower().count(m) for m in en_markers)
    language = "Português" if pt_count >= en_count else "Inglês"

    return {
        "palavras": len(words),
        "linhas": len(lines),
        "caracteres": chars,
        "tempo_leitura_min": round(read_minutes, 1),
        "idioma_provavel": language,
    }


def detect_quick_flags(text: str) -> list[str]:
    """Detecta rapidamente categorias de risco presentes no documento."""
    flags = []
    text_lower = text.lower()

    checks = [
        ("💰 Multas/Penalidades", ["multa", "penalidade", "cláusula penal", "penalty"]),
        ("🔄 Renovação Automática", ["renovação automática", "prorrogado automaticamente", "auto-renewal"]),
        ("🔒 Dados Pessoais", ["dados pessoais", "lgpd", "gdpr", "privacidade", "privacy policy"]),
        ("🚫 Não-Concorrência", ["não concorrência", "non-compete", "exclusividade", "non-solicitation"]),
        ("⚖️ Arbitragem", ["arbitragem", "arbitration", "mediação obrigatória"]),
        ("📍 Foro Específico", ["foro da comarca", "jurisdiction", "foro exclusivo"]),
        ("✏️ Modificação Unilateral", ["reserva-se o direito de alterar", "may modify at any time", "sem consentimento"]),
        ("🛑 Rescisão Unilateral", ["a qualquer momento", "sem aviso prévio", "without notice"]),
    ]

    for label, keywords in checks:
        if any(kw in text_lower for kw in keywords):
            flags.append(label)

    return flags


def main():
    parser = argparse.ArgumentParser(
        description="Extrai e analisa texto de documentos jurídicos (PDF, DOCX, TXT)"
    )
    parser.add_argument("filepath", help="Caminho para o documento jurídico")
    parser.add_argument(
        "--output", "-o",
        help="Salvar texto extraído neste arquivo",
        default=None
    )
    parser.add_argument(
        "--stats", "-s",
        action="store_true",
        help="Exibir estatísticas do documento"
    )
    parser.add_argument(
        "--flags-only", "-f",
        action="store_true",
        help="Exibir apenas as categorias de risco detectadas (sem texto completo)"
    )
    args = parser.parse_args()

    filepath = Path(args.filepath)
    if not filepath.exists():
        print(f"❌ Arquivo não encontrado: {filepath}", file=sys.stderr)
        sys.exit(1)

    ext = filepath.suffix.lower()

    print(f"🔍 Processando: {filepath.name} ({ext})", file=sys.stderr)

    if ext == ".pdf":
        text = extract_from_pdf(str(filepath))
    elif ext in (".docx", ".doc"):
        text = extract_from_docx(str(filepath))
    elif ext in (".txt", ".md", ".text"):
        text = extract_from_txt(str(filepath))
    else:
        print(f"⚠️  Formato '{ext}' não suportado diretamente. Tentando como texto...", file=sys.stderr)
        text = extract_from_txt(str(filepath))

    if not text.strip():
        print("⚠️  Nenhum texto extraído. O documento pode estar protegido ou ser uma imagem escaneada.", file=sys.stderr)
        sys.exit(1)

    # Estatísticas
    if args.stats or args.flags_only:
        stats = compute_stats(text)
        print("\n📊 ESTATÍSTICAS DO DOCUMENTO", file=sys.stderr)
        print(f"   Palavras:        {stats['palavras']:,}", file=sys.stderr)
        print(f"   Linhas:          {stats['linhas']:,}", file=sys.stderr)
        print(f"   Caracteres:      {stats['caracteres']:,}", file=sys.stderr)
        print(f"   Tempo de leitura: ~{stats['tempo_leitura_min']} min", file=sys.stderr)
        print(f"   Idioma provável: {stats['idioma_provavel']}", file=sys.stderr)

        flags = detect_quick_flags(text)
        if flags:
            print("\n🚩 CATEGORIAS DE RISCO DETECTADAS (pré-análise):", file=sys.stderr)
            for flag in flags:
                print(f"   {flag}", file=sys.stderr)
        else:
            print("\n✅ Nenhuma categoria de risco óbvia detectada na pré-análise.", file=sys.stderr)

    # Saída do texto
    if args.flags_only:
        # Apenas imprime as flags detectadas como JSON simples
        import json
        flags = detect_quick_flags(text)
        stats = compute_stats(text)
        print(json.dumps({"flags": flags, "stats": stats}, ensure_ascii=False, indent=2))
        return

    if args.output:
        output_path = Path(args.output)
        output_path.write_text(text, encoding="utf-8")
        print(f"\n✅ Texto extraído salvo em: {output_path}", file=sys.stderr)
        print(f"   {len(text.split()):,} palavras extraídas.", file=sys.stderr)
    else:
        # Imprime o texto extraído no stdout para ser capturado
        print(text)


if __name__ == "__main__":
    main()
