"""
Roda uma vez para criar as tabelas e popular dados iniciais
(o mesmo usuário e os mesmos processos de exemplo que já existiam
em memória no script.js original).

Uso:
    python seed.py
"""

from werkzeug.security import generate_password_hash

from models import init_db, Usuario, Processo, Documento, db

SAMPLE_PROCESSOS = [
    dict(protocolo='#2026-00123', empresa='Restaurante Sabor Ltda',  cnpj='12.345.678/0001-90',
         status='Aprovado',     ia_status='Válida',   tipo='Alvará Sanitário'),
    dict(protocolo='#2026-00124', empresa='Mercado Bom Preço',       cnpj='98.765.432/0001-19',
         status='Em análise',   ia_status='Válida',   tipo='Renovação',
         observacao='Documento técnico com campo responsável incompleto.'),
    dict(protocolo='#2026-00125', empresa='Padaria Doce Pão',        cnpj='11.222.333/0001-81',
         status='Com erro',     ia_status='Válida',   tipo='Novo',
         observacao='Alvará anterior com data de validade expirada.'),
    dict(protocolo='#2026-00126', empresa='Clínica Saúde+',          cnpj='44.555.888/0001-28',
         status='Ag. correção', ia_status='Inválida', tipo='Renovação',
         observacao='Responsável técnico não está cadastrado no CRM.'),
    dict(protocolo='#2026-00127', empresa='Farmácia Vida',           cnpj='77.888.999/0001-38',
         status='Aprovado',     ia_status='Válida',   tipo='Alvará Sanitário'),
]


def run():
    init_db()
    db.connect(reuse_if_open=True)

    analista, criado = Usuario.get_or_create(
        email='analista@vigilancia.pr',
        defaults=dict(
            nome='Dra. Carla Mendes',
            senha_hash=generate_password_hash('123456'),
            papel='analista',
        ),
    )
    print('Usuário analista:', 'criado' if criado else 'já existia')

    for dados in SAMPLE_PROCESSOS:
        processo, criado = Processo.get_or_create(
            protocolo=dados['protocolo'],
            defaults=dict(
                empresa=dados['empresa'],
                cnpj=dados['cnpj'],
                status=dados['status'],
                ia_status=dados['ia_status'],
                tipo=dados['tipo'],
                analista=analista,
                observacao=dados.get('observacao', ''),
            ),
        )
        print(f"Processo {dados['protocolo']}:", 'criado' if criado else 'já existia')

    db.close()
    print('\nSeed concluído.')


if __name__ == '__main__':
    run()