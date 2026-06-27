'use strict';

/* ══════════════════════════════════════════════
   VIGILÂNCIANET — Application Logic (Analista)
══════════════════════════════════════════════ */

const API_BASE = 'http://localhost:8080';

const CREDENTIALS = {
  analyst: { email: 'analista@vigilancia.pr', senha: '123456' },
};

// Os processos agora vêm do backend (Supabase). O array começa vazio
// e é populado por loadProcesses().
let processes = [];

// Protocolo do processo sendo criado na tela "Novo Protocolo" — fica null
// até o usuário clicar em "Enviar para Análise" e o processo ser criado no banco.
window._currentProcessoId = null;

/* ══════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════ */

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const err = document.getElementById('login-error');

  if (err) {
    err.textContent = '';
    err.style.display = 'none';
  }

  if (!email || !senha) {
    if (err) {
      err.textContent = 'Preencha e-mail e senha.';
      err.style.display = 'block';
    }
    return;
  }

  try {
    const resposta = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: email, senha: senha })
    });

    const resultado = await resposta.text();

    if (resultado === "LOGIN_OK") {
      setRole();
    } else {
      if (err) {
        err.textContent = "E-mail ou senha inválidos.";
        err.style.display = 'block';
      }
    }
  } catch (e) {
    console.error('Erro na requisição:', e);
    if (err) {
      err.textContent = "Erro ao conectar com o servidor backend.";
      err.style.display = 'block';
    }
  }
}

/* ══════════════════════════════════════════════
   PROCESSOS — busca real no backend (Supabase)
══════════════════════════════════════════════ */

// Busca a lista de processos no backend e atualiza o array local.
// Retorna true se a busca deu certo, false se falhou (mantém o array anterior).
async function loadProcesses() {
  try {
    const resp = await fetch(`${API_BASE}/api/processos`);
    if (!resp.ok) throw new Error('Falha ao buscar processos');
    processes = await resp.json();
    return true;
  } catch (e) {
    console.error('Erro ao carregar processos:', e);
    return false;
  }
}

/* ══════════════════════════════════════════════
   APP SETUP
══════════════════════════════════════════════ */

async function setRole() {
  document.getElementById('role-switcher').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  await renderApp();
}

function switchRole() {
  document.getElementById('role-switcher').style.display = '';
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-email').value = '';
  document.getElementById('login-senha').value = '';
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-error').style.display = 'none';
  ['login-email','login-senha'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.remove('input-error');
  });
}

async function renderApp() {
  renderSidebar();
  await renderAnalystDashboard();
}

/* ══════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════ */

function renderSidebar() {
  const items = [
    { icon: iconHome(),     label: 'Dashboard',        page: 'analyst-dashboard', active: true },
    { icon: iconSend(),     label: 'Novo Protocolo',   page: 'analyst-new' },
    { icon: iconList(),     label: 'Processos',        page: 'analyst-processes' },
    { icon: iconCalendar(), label: 'Vistorias',        page: 'analyst-vistorias' },
    { icon: iconChart(),    label: 'Relatórios',       page: 'analyst-reports' },
    { icon: iconGear(),     label: 'Configurações',    page: 'analyst-config' },
  ];

  let html = `<div class="sidebar-section"><div class="sidebar-label">Menu principal</div>`;
  items.forEach(item => {
    html += `<button class="nav-item${item.active ? ' active' : ''}" data-page="${item.page}" onclick="navTo('${item.page}',this)">
      ${item.icon} ${item.label}
      ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
    </button>`;
  });
  html += '</div>';
  document.getElementById('sidebar').innerHTML = html;
}

async function navTo(page, btn) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const pages = {
    'analyst-dashboard':  renderAnalystDashboard,
    'analyst-new':        renderAnalystNew,
    'analyst-processes':  renderAnalystProcesses,
    'analyst-vistorias':  renderAnalystVistorias,
    'analyst-reports':    renderAnalystReports,
    'analyst-config':     renderAnalystConfig,
  };
  if (pages[page]) await pages[page]();
}

/* ══════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════ */

async function renderAnalystDashboard() {
  // mostra um estado de carregamento simples enquanto busca o banco
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Dashboard do Analista</div>
      <div class="page-sub">Carregando dados do banco…</div>
    </div>`;

  await loadProcesses();

  const total = processes.length;
  const pendentes = processes.filter(p => p.status === 'Pendente' || p.status === 'Ag. correção').length;
  const emAnalise = processes.filter(p => p.status === 'Em análise').length;
  const aprovados = processes.filter(p => p.status === 'Aprovado').length;
  const comErro   = processes.filter(p => p.status === 'Com erro').length;
  const taxaAprovacao = total ? Math.round((aprovados / total) * 100) : 0;

  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Dashboard do Analista</div>
      <div class="page-sub">Visão geral dos processos em andamento — dados em tempo real do banco.</div>
    </div>

    <div class="metrics">
      <div class="metric amber"><div class="metric-label">⏳ Pendentes</div><div class="metric-value">${pendentes}</div><div class="metric-sub">aguardando análise</div></div>
      <div class="metric blue"><div class="metric-label">🔍 Em análise</div><div class="metric-value">${emAnalise}</div><div class="metric-sub">em revisão ativa</div></div>
      <div class="metric green"><div class="metric-label">✓ Aprovados</div><div class="metric-value">${aprovados}</div><div class="metric-sub">no total</div></div>
      <div class="metric red"><div class="metric-label">⚠ Com erro</div><div class="metric-value">${comErro}</div><div class="metric-sub">requerem correção</div></div>
    </div>

    <div class="grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Taxa de aprovação</div></div>
          <span style="font-size:22px;font-weight:700;color:var(--green)">${taxaAprovacao}%</span>
        </div>
        <div class="card-body">
          <div class="progress-bar" style="margin-bottom:8px"><div class="progress-fill green" style="width:${taxaAprovacao}%"></div></div>
          <div style="font-size:12px;color:var(--gray-400)">Calculado sobre ${total} processo(s) cadastrado(s)</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Total de processos</div></div>
          <span style="font-size:22px;font-weight:700;color:var(--brand)">${total}</span>
        </div>
        <div class="card-body">
          <div style="font-size:12px;color:var(--gray-400)">Todos os registros cadastrados no banco de dados</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div><div class="card-title">${iconList()} Processos Recentes</div></div>
        <button class="btn btn-ghost btn-sm" onclick="navTo('analyst-processes',null)">Ver todos</button>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          ${total === 0 ? `<div style="padding:22px;color:var(--gray-400);font-size:13px">Nenhum processo cadastrado ainda.</div>` : `
          <table>
            <thead><tr><th>Protocolo</th><th>Empresa</th><th>CNPJ</th><th>Status</th><th>Validação IA</th><th>Ação</th></tr></thead>
            <tbody>
              ${processes.slice(0, 5).map((p, i) => `<tr>
                <td><code class="proto">${p.id}</code></td>
                <td style="font-weight:500">${p.empresa}</td>
                <td style="color:var(--gray-400);font-size:12px;font-family:'JetBrains Mono',monospace">${p.cnpj}</td>
                <td>${statusBadge(p.status)}</td>
                <td>${iaBadge(p.ia)}</td>
                <td><button class="btn btn-primary btn-sm" onclick="openAnalystModal(${i})">Abrir</button></td>
              </tr>`).join('')}
            </tbody>
          </table>`}
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════
   NOVO PROTOCOLO
══════════════════════════════════════════════ */

function renderAnalystNew() {
  window._uploads = {};
  window._currentProcessoId = null;
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Novo Protocolo</div>
      <div class="page-sub">Registre um novo processo sanitário, faça upload dos documentos e acompanhe a validação por IA.</div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title">${iconUser()} Dados do Solicitante</div></div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nome da Empresa <span class="required">*</span></label>
            <input class="form-input" placeholder="Ex: Restaurante Sabor Ltda" id="nome-empresa">
          </div>
          <div class="form-group">
            <label class="form-label">CNPJ <span class="required">*</span></label>
            <input class="form-input" placeholder="00.000.000/0000-00" id="cnpj" oninput="maskCNPJ(this)">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Responsável Técnico <span class="required">*</span></label>
            <input class="form-input" placeholder="Nome completo" id="resp-tec">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Processo <span class="required">*</span></label>
            <select class="form-select" id="tipo-proc">
              <option value="">Selecione...</option>
              <option>Alvará Sanitário</option>
              <option>Renovação</option>
              <option>Novo processo</option>
              <option>Segunda via</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Telefone</label>
            <input class="form-input" placeholder="(43) 99999-0000">
          </div>
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input class="form-input" placeholder="empresa@email.com">
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title">${iconUpload()} Upload de Documentos</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
        ${uploadZone('alvara',  '📄', 'Alvará Anterior',   'PDF, máx. 5MB')}
        ${uploadZone('tecnico', '📋', 'Documento Técnico', 'PDF, máx. 5MB')}
        ${uploadZone('licenca', '🏥', 'Licença Sanitária', 'PDF, máx. 5MB')}
      </div>
    </div>

    <div class="card" id="ai-validation-card" style="margin-bottom:16px;display:none">
      <div class="card-header">
        <div class="card-title" style="display:flex;align-items:center;gap:8px">
          ${iconAI()} Validação Automática por IA
          <span id="ai-loading" style="display:none">
            <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
          </span>
        </div>
      </div>
      <div class="card-body" id="ai-results"></div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title">📍 Acompanhamento do Processo</div></div>
      <div class="card-body">
        <div class="track">
          <div class="track-step"><div class="track-circle active" id="tc1">1</div><div class="track-label">Enviado</div></div>
          <div class="track-line" id="tl1"></div>
          <div class="track-step"><div class="track-circle wait" id="tc2">2</div><div class="track-label">Em Análise</div></div>
          <div class="track-line" id="tl2"></div>
          <div class="track-step"><div class="track-circle wait" id="tc3">⚠</div><div class="track-label">Ag. Correção</div></div>
          <div class="track-line" id="tl3"></div>
          <div class="track-step"><div class="track-circle wait" id="tc4">📅</div><div class="track-label">Vistoria</div></div>
          <div class="track-line" id="tl4"></div>
          <div class="track-step"><div class="track-circle wait" id="tc5">✓</div><div class="track-label">Aprovado</div></div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:12px;justify-content:flex-end;padding-bottom:8px">
      <button class="btn btn-ghost" onclick="navTo('analyst-dashboard', document.querySelector('[data-page=analyst-dashboard]'))">Cancelar</button>
      <button class="btn btn-primary" onclick="submitProcess()">${iconSend()} Enviar para Análise</button>
    </div>
  `;
}

function uploadZone(type, emoji, label, hint) {
  return `<div class="upload-zone" id="zone-${type}">
    <input type="file" accept=".pdf" onchange="handleFileInput(event,'${type}')" style="display:none;" id="file-${type}">
    <div class="upload-info" onclick="document.getElementById('file-${type}').click()" style="cursor:pointer;">
      <div class="upload-icon doc">${emoji}</div>
      <div><div class="upload-name">${label}</div><div class="upload-hint">${hint}</div></div>
    </div>
    <button class="btn btn-ghost btn-sm" type="button" onclick="document.getElementById('file-${type}').click()">${iconUpload()} Selecionar</button>
  </div>`;
}

// handleFileInput dispara a validação real via backend a cada arquivo selecionado
function handleFileInput(e, type) {
  e.stopPropagation();
  const file = e.target.files[0];
  if (!file) return;
  window._uploads = window._uploads || {};
  window._uploads[type] = file;
  const zone = document.getElementById('zone-' + type);
  zone.classList.add('has-file');
  zone.querySelector('.upload-info').innerHTML = `
    <div class="upload-icon ok">✅</div>
    <div><div class="upload-name">${file.name}</div><div class="upload-hint">${(file.size / 1024).toFixed(0)} KB · Enviado</div></div>
  `;
  zone.querySelector('button').innerHTML = '✓ Carregado';
  // nesta etapa o processo ainda não existe no banco, então só mostramos
  // o resultado da IA sem persistir ainda (sem processoId)
  runAIValidationReal(null);
}

// Envia os PDFs para o backend e exibe a análise da IA.
// Se processoId for informado, o backend também salva o resultado
// na tabela "documentos", vinculado a esse processo.
async function runAIValidationReal(processoId) {
  const card = document.getElementById('ai-validation-card');
  card.style.display = '';
  document.getElementById('ai-loading').style.display = '';
  document.getElementById('ai-results').innerHTML =
    '<div style="color:var(--gray-400);font-size:13px;padding:4px 0">Analisando documentos com IA…</div>';

  const form = new FormData();
  const uploads = window._uploads || {};
  for (const [campo, arquivo] of Object.entries(uploads)) {
    form.append(campo, arquivo);
  }
  if (processoId) {
    form.append('processo_id', processoId);
  }

  try {
    const resp = await fetch(`${API_BASE}/api/validar-docs`, {
      method: 'POST',
      body: form
    });
    const data = await resp.json();
    document.getElementById('ai-loading').style.display = 'none';
    renderAIResults(data);
    return data;
  } catch (err) {
    document.getElementById('ai-loading').style.display = 'none';
    document.getElementById('ai-results').innerHTML =
      '<div style="color:var(--red);font-size:13px">Erro ao conectar com o servidor de IA.</div>';
    return null;
  }
}

// Renderiza o resultado da IA no card de validação
function renderAIResults(data) {
  const nomes = { alvara: 'Alvará Anterior', tecnico: 'Documento Técnico', licenca: 'Licença Sanitária' };
  let rows = '';

  for (const [campo, info] of Object.entries(data.documentos || {})) {
    rows += aiRow(info.status, nomes[campo] || campo, info.mensagem);
  }

  if (data.coerencia) {
    rows += aiRow(data.coerencia.status, 'Coerência entre documentos', data.coerencia.mensagem);
  }

  document.getElementById('ai-results').innerHTML = `
    <div class="ai-box">
      <div class="ai-header">${iconAI()} <span class="ai-title">Resultado da Validação — ${data.resumo || ''}</span></div>
      ${rows}
    </div>
  `;
}

function aiRow(type, label, msg) {
  const cls  = type === 'ok' ? 'ok-item' : type === 'error' ? 'error-item' : 'warn';
  const icon = type === 'ok' ? iconCheckGreen() : type === 'error' ? iconX() : iconWarn();
  return `<div class="ai-item ${cls}">${icon} <div><strong>${label}</strong> — ${msg}</div></div>`;
}

// Cria o processo no banco (Supabase) e, se houver documentos enviados,
// roda a validação de novo já vinculada ao processo, para persistir o resultado.
async function submitProcess() {
  const nome = document.getElementById('nome-empresa')?.value.trim();
  const cnpj = document.getElementById('cnpj')?.value.trim();
  const tipo = document.getElementById('tipo-proc')?.value || 'Novo';

  if (!nome || !cnpj) { showToast('Preencha os campos obrigatórios.', 'error-t', '⚠️'); return; }

  let processoCriado;
  try {
    const resp = await fetch(`${API_BASE}/api/processos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa: nome, cnpj: cnpj, tipo: tipo })
    });
    if (!resp.ok) {
      const erro = await resp.json().catch(() => ({}));
      showToast(erro.erro || 'Não foi possível registrar o processo.', 'error-t', '⚠️');
      return;
    }
    processoCriado = await resp.json();
  } catch (e) {
    showToast('Erro ao conectar com o servidor.', 'error-t', '⚠️');
    return;
  }

  window._currentProcessoId = processoCriado.id;
  showToast(`Protocolo ${processoCriado.id} registrado com sucesso!`, 'success', '✅');

  // se já tinha documentos enviados, roda a validação de novo, agora persistindo no processo criado
  const temUploads = window._uploads && Object.keys(window._uploads).length > 0;
  if (temUploads) {
    await runAIValidationReal(processoCriado.id);
  }

  setTimeout(() => {
    const tc1 = document.getElementById('tc1');
    const tc2 = document.getElementById('tc2');
    const tl1 = document.getElementById('tl1');
    if (tc1) tc1.className = 'track-circle done';
    if (tc2) tc2.className = 'track-circle done';
    if (tl1) tl1.classList.add('done');
  }, 500);
}

function maskCNPJ(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/^(\d{2})(\d)/,       '$1.$2');
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/,      '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/,              '.$1/$2');
  v = v.replace(/(\d{4})(\d)/,                '$1-$2');
  input.value = v;
}

/* ══════════════════════════════════════════════
   PROCESSOS
══════════════════════════════════════════════ */

async function renderAnalystProcesses() {
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Lista de Processos</div>
      <div class="page-sub">Carregando dados do banco…</div>
    </div>`;

  await loadProcesses();

  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Lista de Processos</div>
      <div class="page-sub">Gerencie todos os processos ativos — dados em tempo real do banco.</div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-body" style="display:flex;gap:12px;align-items:center">
        <input class="form-input" style="max-width:300px" placeholder="🔍 Buscar empresa, CNPJ ou protocolo…" oninput="filterTable(this.value, null)">
        <select class="form-select" style="max-width:190px" onchange="filterTable(null, this.value)">
          <option value="">Todos os status</option>
          <option>Pendente</option><option>Em análise</option><option>Aprovado</option><option>Com erro</option><option>Ag. correção</option>
        </select>
        <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="navTo('analyst-processes', document.querySelector('[data-page=analyst-processes]'))">↻ Atualizar</button>
      </div>
    </div>
    <div class="card">
      <div class="card-body" style="padding:0">
        ${processes.length === 0 ? `<div style="padding:22px;color:var(--gray-400);font-size:13px">Nenhum processo cadastrado ainda.</div>` : `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Protocolo</th><th>Empresa</th><th>CNPJ</th><th>Tipo</th><th>Data</th><th>Status</th><th>IA</th><th>Analista</th><th>Ação</th></tr></thead>
            <tbody id="ptbody">
              ${processes.map((p, i) => `<tr data-empresa="${p.empresa.toLowerCase()}" data-id="${p.id.toLowerCase()}" data-status="${p.status}">
                <td><code class="proto">${p.id}</code></td>
                <td style="font-weight:500">${p.empresa}</td>
                <td style="color:var(--gray-400);font-size:12px;font-family:'JetBrains Mono',monospace">${p.cnpj}</td>
                <td style="font-size:12px">${p.tipo}</td>
                <td style="font-size:12px">${p.data}</td>
                <td>${statusBadge(p.status)}</td>
                <td>${iaBadge(p.ia)}</td>
                <td style="font-size:12px;color:var(--gray-500)">${p.analista || '—'}</td>
                <td><button class="btn btn-primary btn-sm" onclick="openAnalystModal(${i})">Abrir</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>
  `;
}

let _searchVal = '', _statusVal = '';
function filterTable(search, status) {
  if (search !== null) _searchVal = search.toLowerCase();
  if (status !== null) _statusVal = status;
  document.querySelectorAll('#ptbody tr').forEach(r => {
    const matchSearch = !_searchVal || r.dataset.empresa.includes(_searchVal) || r.dataset.id.includes(_searchVal);
    const matchStatus = !_statusVal || r.dataset.status === _statusVal;
    r.style.display = matchSearch && matchStatus ? '' : 'none';
  });
}

/* ══════════════════════════════════════════════
   MODAL DE DETALHES DO PROCESSO
══════════════════════════════════════════════ */

// Busca o detalhe completo do processo (incluindo documentos) no backend e abre o modal.
async function openAnalystModal(index) {
  const resumo = processes[index];
  if (!resumo) return;

  const modalOverlay = document.getElementById('modal');
  const modalInner = document.getElementById('modal-inner');

  modalInner.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">${resumo.id}</div>
      <button class="modal-close" onclick="closeAnalystModal()">&times;</button>
    </div>
    <div class="modal-body"><div style="color:var(--gray-400);font-size:13px">Carregando detalhes…</div></div>
  `;
  modalOverlay.classList.add('open');

  try {
    const resp = await fetch(`${API_BASE}/api/processos/${encodeURIComponent(resumo.id)}`);
    const detalhe = await resp.json();

    const nomesDoc = { alvara: 'Alvará Anterior', tecnico: 'Documento Técnico', licenca: 'Licença Sanitária' };
    const docsHtml = (detalhe.documentos && detalhe.documentos.length)
      ? detalhe.documentos.map(d => aiRow(d.status, nomesDoc[d.tipo] || d.tipo, d.mensagem)).join('')
      : `<div style="padding:14px 0;color:var(--gray-400);font-size:13px">Nenhum documento analisado ainda para este processo.</div>`;

    modalInner.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">${detalhe.id} — ${detalhe.empresa}</div>
        <button class="modal-close" onclick="closeAnalystModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-panel" style="margin-bottom:20px">
          <div>
            <div class="detail-label">Dados do processo</div>
            <div class="detail-row"><span class="detail-key">CNPJ</span><span class="detail-val">${detalhe.cnpj}</span></div>
            <div class="detail-row"><span class="detail-key">Tipo</span><span class="detail-val">${detalhe.tipo}</span></div>
            <div class="detail-row"><span class="detail-key">Analista</span><span class="detail-val">${detalhe.analista || '—'}</span></div>
          </div>
          <div>
            <div class="detail-label">Situação</div>
            <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val">${statusBadge(detalhe.status)}</span></div>
            <div class="detail-row"><span class="detail-key">Validação IA</span><span class="detail-val">${iaBadge(detalhe.ia)}</span></div>
            <div class="detail-row"><span class="detail-key">Data</span><span class="detail-val">${detalhe.data}</span></div>
          </div>
        </div>
        ${detalhe.obs ? `<div class="flag warn" style="margin-bottom:16px">${detalhe.obs}</div>` : ''}
        <div class="ai-box">
          <div class="ai-header">${iconAI()} <span class="ai-title">Documentos analisados</span></div>
          ${docsHtml}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeAnalystModal()">Fechar</button>
      </div>
    `;
  } catch (e) {
    modalInner.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">${resumo.id}</div>
        <button class="modal-close" onclick="closeAnalystModal()">&times;</button>
      </div>
      <div class="modal-body"><div style="color:var(--red);font-size:13px">Erro ao carregar detalhes do processo.</div></div>
    `;
  }
}

function closeAnalystModal() {
  document.getElementById('modal').classList.remove('open');
}

/* ══════════════════════════════════════════════
   VISTORIAS
══════════════════════════════════════════════ */

function renderAnalystVistorias() {
  const vistorias = [
    { data:'15/04/2026', hora:'09:00', empresa:'Restaurante Sabor Ltda', end:'Rua das Flores, 123 — Centro',  analista:'Dra. Carla M.' },
    { data:'17/04/2026', hora:'14:00', empresa:'Farmácia Vida',          end:'Av. Brasil, 456 — Zona Norte',  analista:'Dr. Bruno R.' },
    { data:'22/04/2026', hora:'10:30', empresa:'Clínica Saúde+',         end:'Rua São Paulo, 789 — Zona Sul', analista:'Dra. Carla M.' },
  ];
  const months = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Vistorias Agendadas</div>
      <div class="page-sub">Próximas inspeções de campo programadas.</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${vistorias.map(v => {
        const [d, m] = v.data.split('/');
        return `<div class="vistoria-card" style="display:flex; align-items:center; padding:12px; border:1px solid #eee; border-radius:8px; gap:16px;">
          <div class="vistoria-date-block" style="text-align:center; min-width:50px;">
            <div class="vistoria-day" style="font-size:20px; font-weight:bold;">${d}</div>
            <div class="vistoria-month" style="font-size:12px; text-transform:uppercase; color:var(--brand);">${months[parseInt(m)]}</div>
          </div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--gray-900);margin-bottom:3px">${v.empresa}</div>
            <div style="font-size:12px;color:var(--gray-500)">${v.end}</div>
            <div style="font-size:12px;color:var(--gray-400);margin-top:3px">${v.hora} · ${v.analista}</div>
          </div>
          <button class="btn btn-ghost btn-sm">Ver detalhes</button>
        </div>`;
      }).join('')}
    </div>
  `;
}

/* ══════════════════════════════════════════════
   STUBS & INTERNALS (Para evitar erros de execução)
══════════════════════════════════════════════ */
function iconHome() { return '🏠'; }
function iconSend() { return '✈️'; }
function iconList() { return '📋'; }
function iconCalendar() { return '📅'; }
function iconChart() { return '📊'; }
function iconGear() { return '⚙️'; }
function iconUser() { return '👤'; }
function iconUpload() { return '📤'; }
function iconAI() { return '🤖'; }
function iconCheckGreen() { return '🟢'; }
function iconX() { return '❌'; }
function iconWarn() { return '⚠️'; }

function statusBadge(status) { return `<span class="badge">${status}</span>`; }
function iaBadge(ia) { return `<span class="badge-ia">${ia}</span>`; }
function showToast(msg, type, icon) {
  const toast = document.getElementById('toast');
  if (!toast) { console.log(`${icon} [${type.toUpperCase()}] ${msg}`); return; }
  document.getElementById('toast-icon').textContent = icon || '';
  document.getElementById('toast-msg').textContent = msg;
  toast.className = `toast show ${type || ''}`;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
}
function renderAnalystReports() { document.getElementById('content').innerHTML = '<h3>Relatórios</h3>'; }
function renderAnalystConfig() { document.getElementById('content').innerHTML = '<h3>Configurações</h3>'; }

// fecha o modal clicando fora dele (no fundo escurecido)
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('modal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAnalystModal();
    });
  }
});