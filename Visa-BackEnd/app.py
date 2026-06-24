from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import os
import json
import re

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

template_dir = os.path.abspath(os.path.join(BASE_DIR, '../Visa-FrontEnd/templates'))
static_dir   = os.path.abspath(os.path.join(BASE_DIR, '../Visa-FrontEnd/static'))

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
CORS(app)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

CREDENTIALS = {
    "analista@vigilancia.pr": "123456"
}

@app.route('/api/login', methods=['POST'])
def login():
    data  = request.get_json()
    email = data.get('email', '').strip()
    senha = data.get('senha', '').strip()
    if CREDENTIALS.get(email) == senha:
        return 'LOGIN_OK', 200
    return 'LOGIN_FAIL', 401

@app.route('/api/validar-docs', methods=['POST'])
def validar_docs():
    try:
        arquivos = request.files
        textos = {}

        for campo in ['alvara', 'tecnico', 'licenca']:
            if campo in arquivos:
                arquivo = arquivos[campo]
                try:
                    import pdfplumber
                    with pdfplumber.open(arquivo) as pdf:
                        texto = '\n'.join(
                            page.extract_text() or '' for page in pdf.pages
                        ).strip()
                    textos[campo] = texto if texto else '[PDF sem texto extraível]'
                except Exception as e:
                    textos[campo] = f'[Erro ao ler PDF: {str(e)}]'

        if not textos:
            return jsonify({'erro': 'Nenhum documento recebido.'}), 400

        prompt = _montar_prompt(textos)

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1024,
        )

        resposta_texto = response.choices[0].message.content
        resultado = _parsear_resposta(resposta_texto, textos)
        return jsonify(resultado)

    except Exception as e:
        import traceback
        print("ERRO COMPLETO:", traceback.format_exc())
        return jsonify({'erro': str(e)}), 500


def _montar_prompt(textos: dict) -> str:
    partes = []
    nomes = {
        'alvara':  'Alvará Anterior',
        'tecnico': 'Documento Técnico',
        'licenca': 'Licença Sanitária'
    }
    for campo, texto in textos.items():
        partes.append(f"=== {nomes.get(campo, campo).upper()} ===\n{texto}")

    docs_str = '\n\n'.join(partes)

    return f"""Você é um analista de Vigilância Sanitária. Analise os documentos abaixo e verifique:
1. Se cada documento está correto e completo individualmente.
2. Se os documentos são coerentes entre si (CNPJ, nome da empresa, responsável técnico, datas e validades batem).
3. Identifique qualquer inconsistência, campo ausente ou irregularidade.

Responda APENAS em JSON válido, sem texto extra, sem markdown, sem blocos de código, com esta estrutura:
{{
  "status_geral": "valido" ou "atencao" ou "invalido",
  "documentos": {{
    "alvara":  {{"status": "ok" ou "warn" ou "error", "mensagem": "..."}},
    "tecnico": {{"status": "ok" ou "warn" ou "error", "mensagem": "..."}},
    "licenca": {{"status": "ok" ou "warn" ou "error", "mensagem": "..."}}
  }},
  "coerencia": {{
    "status": "ok" ou "warn" ou "error",
    "mensagem": "..."
  }},
  "resumo": "Frase curta com o resultado geral."
}}

Para documentos não enviados, use status "warn" com mensagem "Documento não enviado".

DOCUMENTOS:
{docs_str}"""


def _parsear_resposta(texto: str, textos_enviados: dict) -> dict:
    match = re.search(r'\{.*\}', texto, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    docs = {}
    for campo in ['alvara', 'tecnico', 'licenca']:
        if campo in textos_enviados:
            docs[campo] = {"status": "warn", "mensagem": "Não foi possível analisar este documento."}
        else:
            docs[campo] = {"status": "warn", "mensagem": "Documento não enviado."}

    return {
        "status_geral": "atencao",
        "documentos": docs,
        "coerencia": {"status": "warn", "mensagem": "Análise inconclusiva."},
        "resumo": "Erro ao processar resposta da IA."
    }


@app.route('/')
def home():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True, port=8080)