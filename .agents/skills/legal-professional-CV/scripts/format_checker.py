import sys
import re

def check_structure(filepath):
    """
    Um script simples (mock) para validar se a resposta gerada contém
    as seções obrigatórias estipuladas pelas regras da skill "legal-professional-CV".
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
            
        required_sections = [
            "Skills principais",
            "Skills técnicas",
            "Skills comportamentais",
            "Ferramentas e tecnologias"
        ]
        
        missing = []
        for section in required_sections:
            if not re.search(section, text, re.IGNORECASE):
                missing.append(section)
                
        if missing:
            print(f"Atenção: A resposta parece estar sem as seguintes seções obigatórias: {', '.join(missing)}")
            return False
            
        print("Estrutura da resposta validada com sucesso.")
        return True
    except FileNotFoundError:
        print(f"Erro: Arquivo '{filepath}' não encontrado.")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        check_structure(sys.argv[1])
    else:
        print("Uso: python format_checker.py <arquivo_de_texto>")
