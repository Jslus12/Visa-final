"""
VigilânciaNet — Camada de dados (Peewee ORM)

Funciona com Supabase (Postgres), MySQL ou SQLite local, dependendo
apenas da variável de ambiente DATABASE_URL. Isso evita reescrever o
código de banco caso você troque de provedor depois.

Exemplos de DATABASE_URL:
  Supabase  -> postgresql://postgres:SENHA@db.xxxxx.supabase.co:5432/postgres
  MySQL     -> mysql://usuario:senha@localhost:3306/visa_db
  (sem nada) -> sqlite:///visa.db   (arquivo local, ótimo para testar sem configurar nada)
"""

import os
from datetime import datetime, date

from dotenv import load_dotenv
from peewee import (
    Model, CharField, TextField, DateField, DateTimeField, ForeignKeyField
)
from playhouse.db_url import connect

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///visa.db")

# 'connect' detecta o tipo de banco pelo prefixo da URL (postgresql://, mysql://, sqlite:///)
db = connect(DATABASE_URL)


class BaseModel(Model):
    class Meta:
        database = db


class Usuario(BaseModel):
    nome = CharField(max_length=120)
    email = CharField(max_length=160, unique=True)
    senha_hash = CharField(max_length=255)
    papel = CharField(max_length=40, default="analista")  # analista, admin, etc.

    class Meta:
        table_name = "usuarios"


class Processo(BaseModel):
    protocolo = CharField(max_length=30, unique=True)
    empresa = CharField(max_length=200)
    cnpj = CharField(max_length=20)
    tipo = CharField(max_length=60, default="Novo")
    status = CharField(max_length=40, default="Em análise")
    ia_status = CharField(max_length=20, default="Pendente")  # Válida, Inválida, Pendente
    data_abertura = DateField(default=date.today)
    analista = ForeignKeyField(Usuario, backref="processos", null=True)
    observacao = TextField(default="")

    class Meta:
        table_name = "processos"


class Documento(BaseModel):
    processo = ForeignKeyField(Processo, backref="documentos")
    tipo = CharField(max_length=30)  # alvara, tecnico, licenca
    nome_arquivo = CharField(max_length=255, null=True)
    status = CharField(max_length=20, default="warn")  # ok, warn, error
    mensagem = TextField(default="")
    criado_em = DateTimeField(default=datetime.now)

    class Meta:
        table_name = "documentos"


def init_db():
    """Cria as tabelas se não existirem. Seguro de chamar em todo start do app."""
    db.connect(reuse_if_open=True)
    db.create_tables([Usuario, Processo, Documento], safe=True)
    db.close()