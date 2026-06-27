<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Cormorant+Garamond&weight=300&size=32&duration=3500&pause=1200&color=F0EDE6&center=true&vCenter=true&width=700&lines=STATUS+%C2%B7+BANCO+DE+DADOS" />
</div>

<h3 align="center"><sub> C O N T E X T O</sub></h3>

Este documento registra o que já foi feito na integração do **VISA Final**
com banco de dados (Supabase/Postgres) e o que ainda falta, pra servir de
referência pra equipe — principalmente pro Rafael Koti (responsável pelo
banco) e pro Rafael Piasentin (testes | full-stack), que provavelmente vão
continuar essa frente.

---

<h3 align="center"><sub> O &nbsp; Q U E &nbsp; J Á &nbsp; F O I &nbsp; F E I T O</sub></h3>

**Infraestrutura**
- [x] Projeto criado no Supabase (Postgres), região São Paulo
- [x] Conexão configurada via Peewee ORM (`models.py`) usando `DATABASE_URL`
- [x] Conexão resolvida via **Session Pooler** (porta IPv4), já que o
      Transaction Pooler exige IPv6 e a rede usada não suporta

**Schema criado**
- [x] `usuarios` — login, nome, e-mail, senha (com hash), papel
- [x] `processos` — protocolo, empresa, CNPJ, tipo, status, validação IA,
      data, analista responsável (FK), observação
- [x] `documentos` — vinculado a um processo (FK), tipo de documento,
      nome do arquivo, status da validação, mensagem da IA

**Funcionalidades conectadas ao banco**
- [x] Login validado contra a tabela `usuarios` (senha com hash, não em
      texto puro)
- [x] Sessão de verdade no backend (cookie assinado) — rotas de dados
      retornam erro 401 pra quem não estiver logado
- [x] Dashboard e tela "Processos" carregando dados reais do Supabase
      (`GET /api/processos`)
- [x] Modal de detalhes do processo puxando dados reais, incluindo os
      documentos analisados (`GET /api/processos/<protocolo>`)
- [x] Criação de novo processo persistindo no banco (`POST /api/processos`)
- [x] Resultado da validação por IA (Groq) sendo salvo na tabela
      `documentos`, vinculado ao processo
- [x] Script de seed (`seed.py`) pra criar as tabelas e popular dados
      de exemplo

**Preparação pra produção**
- [x] `requirements.txt` e `Procfile` prontos pra hospedar (Render, com
      gunicorn)
- [x] Frontend usando caminho relativo (`API_BASE = ''`), funciona local
      e hospedado sem trocar nada

---

<h3 align="center"><sub> O &nbsp; Q U E &nbsp; F A L T A &nbsp; N O &nbsp; B A N C O</sub></h3>

**Schema / tabelas que ainda não existem**
- [ ] Tabela `vistorias` — a tela "Vistorias Agendadas" ainda usa dados
      fixos no `script.js`, não vem do banco
- [ ] Tabela/estrutura pra **histórico de status** do processo (hoje só
      existe o status atual; não há registro de quando e por quem mudou
      de "Em análise" pra "Aprovado", por exemplo)
- [ ] Tabela de **log/auditoria** (quem criou, quem aprovou, quem editou
      cada processo e quando)

**Dados / arquivos**
- [ ] Os PDFs enviados na validação por IA **não são armazenados** —
      hoje só salvamos o nome do arquivo (`nome_arquivo`) na tabela
      `documentos`, não o arquivo em si. Pra guardar o PDF de verdade,
      precisa configurar o **Supabase Storage** (bucket) e salvar a URL
      do arquivo
- [ ] Não há validação de **CNPJ único** — hoje é possível cadastrar dois
      processos pra empresas com o mesmo CNPJ sem erro

**Gestão de usuários**
- [ ] Não existe tela/rota pra cadastrar novos analistas — hoje é feito
      manualmente via SQL Editor do Supabase (processo descrito no
      `README-DEPLOY.md`)
- [ ] Não há diferenciação de **papéis/permissões** (ex: analista comum
      vs. supervisor que pode aprovar) — a coluna `papel` existe na
      tabela `usuarios`, mas nada no backend usa esse valor ainda

**Migrações e manutenção**
- [ ] Não existe controle de **migrações** — o `models.py` só cria
      tabelas que não existem (`create_tables(safe=True)`); se o schema
      mudar (ex: adicionar uma coluna), não tem um histórico/script
      versionado disso. Vale considerar `peewee-migrate` antes do
      projeto crescer mais
- [ ] **Backups**: o plano gratuito do Supabase usado no projeto não
      inclui backups automáticos (confirmado no próprio painel,
      "Last Backup: No backups") — se for usar com dados reais, vale
      considerar upgrade de plano ou rotina manual de export

**Segurança**
- [ ] A senha do banco e a chave do Groq estão hoje só no `.env` local —
      ainda falta confirmar que esse arquivo está no `.gitignore` antes
      de subir pro GitHub
- [ ] Sem **rate limiting** nas rotas da API (alguém com a senha de login
      poderia, em tese, automatizar muitas requisições)

---

<h3 align="center"><sub> P R Ó X I M O S &nbsp; P A S S O S &nbsp; S U G E R I D O S</sub></h3>

1. Testar o fluxo completo localmente (login → criar processo → validar
   docs → ver no modal)
2. Publicar no Render seguindo o `README-DEPLOY.md`
3. Cadastrar os analistas reais da equipe na tabela `usuarios`
4. Priorizar entre os itens pendentes acima o que faz mais sentido pro
   próximo sprint — provavelmente a tabela de `vistorias` e o
   armazenamento real dos PDFs são os mais visíveis pro usuário final

Os destaques de "falta fazer no banco" que eu mais chamaria atenção pra equipe, se tivesse que escolher 3:

PDFs não são guardados de verdade — só o nome do arquivo é salvo, não o arquivo em si. Se alguém precisar olhar o documento original depois, hoje não tem como.
Tabela de Vistorias — única tela que ainda não foi conectada ao banco, continua com dados fixos.
Sem backup automático no plano gratuito do Supabase — se for usar com dado real de empresa, vale considerar isso antes de ir pra produção de verdade.

---

<div align="center">
`VISA · DEV · LONDRINA`
</div>