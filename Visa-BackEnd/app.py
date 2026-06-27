from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import check_password_hash
from groq import Groq
import os
import json
import re
from datetime import date

from models import init_db, db, Usuario, Processo, Documento

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

template_dir = os.path.abspath(os.path.join(BASE_DIR, '../Visa-FrontEnd/templates'))
static_dir   = os.path.abspath(os.path.join(BASE_DIR, '../Visa-FrontEnd/static'))

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
CORS(app)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# cria as tabelas automaticamente se ainda não existirem
init_db()


@app.before_request
def _abrir_conexao():
    if db.is_closed():
        db.connect(reuse_if_open=True)


@app.teardown_request
def _fechar_conexao(exc):
    if not db.is_closed():
        db.close()


# ══════════════════════════════════════════════
# LOGIN — agora validado contra a tabela usuarios
# ══════════════════════════════════════════════
@app.route('/api/login', methods=['POST'])
def login():
    data  = request.get_json() or {}
    email = data.get('email', '').strip()
    senha = data.get('senha', '').strip()

    usuario = Usuario.get_or_none(Usuario.email == email)
    if usuario and check_password_hash(usuario.senha_hash, senha):
        return 'LOGIN_OK', 200
    return 'LOGIN_FAIL', 401


# ══════════════════════════════════════════════
# PROCESSOS — substitui o array fixo do script.js
# ══════════════════════════════════════════════
def serializar_processo(p: Processo) -> dict:
    return {
        'id': p.protocolo,
        'empresa': p.empresa,
        'cnpj': p.cnpj,
        'status': p.status,
        'ia': p.ia_status,
        'data': p.data_abertura.strftime('%d/%m/%Y') if p.data_abertura else '',
        'analista': p.analista.nome if p.analista else '',
        'tipo': p.tipo,
        'obs': p.observacao,
    }


@app.route('/api/processos', methods=['GET'])
def listar_processos():
    processos = Processo.select().order_by(Processo.id.desc())
    return jsonify([serializar_processo(p) for p in processos])


@app.route('/api/processos/<protocolo>', methods=['GET'])
def detalhar_processo(protocolo):
    processo = Processo.get_or_none(Processo.protocolo == protocolo)
    if not processo:
        return jsonify({'erro': 'Processo não encontrado'}), 404

    docs = [
        {'tipo': d.tipo, 'status': d.status, 'mensagem': d.mensagem, 'arquivo': d.nome_arquivo}
        for d in processo.documentos
    ]
    resultado = serializar_processo(processo)
    resultado['documentos'] = docs
    return jsonify(resultado)


@app.route('/api/processos', methods=['POST'])
def criar_processo():
    data = request.get_json() or {}
    empresa = data.get('empresa', '').strip()
    cnpj = data.get('cnpj', '').strip()
    if not empresa or not cnpj:
        return jsonify({'erro': 'Nome da empresa e CNPJ são obrigatórios.'}), 400

    ultimo = Processo.select().order_by(Processo.id.desc()).first()
    proximo_num = 123 + Processo.select().count()
    ano = date.today().year
    protocolo = f'#{ano}-{proximo_num:05d}'

    processo = Processo.create(
        protocolo=protocolo,
        empresa=empresa,
        cnpj=cnpj,
        tipo=data.get('tipo', 'Novo'),
        status='Em análise',
        ia_status='Pendente',
    )
    return jsonify(serializar_processo(processo)), 201


# ══════════════════════════════════════════════
# VALIDAÇÃO POR IA — mesma lógica de antes, agora
# também grava o resultado na tabela documentos
# ══════════════════════════════════════════════
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

        # se o front mandar o protocolo do processo, persistimos o resultado
        protocolo = request.form.get('processo_id')
        if protocolo:
            _salvar_resultado_no_processo(protocolo, resultado, arquivos)

        return jsonify(resultado)

    except Exception as e:
        import traceback
        print("ERRO COMPLETO:", traceback.format_exc())
        return jsonify({'erro': str(e)}), 500


def _salvar_resultado_no_processo(protocolo: str, resultado: dict, arquivos):
    processo = Processo.get_or_none(Processo.protocolo == protocolo)
    if not processo:
        return

    nomes_doc = {}
    for campo in ['alvara', 'tecnico', 'licenca']:
        if campo in arquivos:
            nomes_doc[campo] = arquivos[campo].filename

    for campo, info in (resultado.get('documentos') or {}).items():
        Documento.create(
            processo=processo,
            tipo=campo,
            nome_arquivo=nomes_doc.get(campo),
            status=info.get('status', 'warn'),
            mensagem=info.get('mensagem', ''),
        )

    status_geral = resultado.get('status_geral', 'atencao')
    processo.ia_status = {'valido': 'Válida', 'atencao': 'Válida', 'invalido': 'Inválida'}.get(status_geral, 'Pendente')
    processo.observacao = resultado.get('resumo', processo.observacao)
    processo.save()


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