'use strict';

/* ══════════════════════════════════════════════
   VIGILÂNCIANET — Application Logic
══════════════════════════════════════════════ */

let currentRole = null;
let pendingRole = null;

// ── Credentials ──
const CREDENTIALS = {
  user:    { email: 'usuario@empresa.com',    senha: '123456' },
  analyst: { email: 'analista@vigilancia.pr', senha: '123456' },
};

// ── Data ──
const processes = [
  { id: '#2026-00123', empresa: 'Restaurante Sabor Ltda',  cnpj: '12.345.678/0001-90', status: 'Aprovado',     ia: 'Válida',   data: '08/04/2026', analista: 'Dra. Carla M.', tipo: 'Alvará Sanitário', docs: { alvara:'ok',  tecnico:'ok',   licenca:'ok'  }, obs: '' },
  { id: '#2026-00124', empresa: 'Mercado Bom Preço',       cnpj: '98.765.432/0001-19', status: 'Em análise',   ia: 'Válida',   data: '09/04/2026', analista: 'Dr. Bruno R.',  tipo: 'Renovação',       docs: { alvara:'ok',  tecnico:'warn', licenca:'ok'  }, obs: 'Documento técnico com campo responsável incompleto.' },
  { id: '#2026-00125', empresa: 'Padaria Doce Pão',        cnpj: '11.222.333/0001-81', status: 'Com erro',     ia: 'Válida',   data: '10/04/2026', analista: 'Dra. Carla M.', tipo: 'Novo',            docs: { alvara:'err', tecnico:'ok',   licenca:'ok'  }, obs: 'Alvará anterior com data de validade expirada.' },
  { id: '#2026-00126', empresa: 'Clínica Saúde+',          cnpj: '44.555.888/0001-28', status: 'Ag. correção', ia: 'Inválida', data: '11/04/2026', analista: 'Dr. Bruno R.',  tipo: 'Renovação',       docs: { alvara:'ok',  tecnico:'err',  licenca:'ok'  }, obs: 'Responsável técnico não está cadastrado no CRM.' },
  { id: '#2026-00127', empresa: 'Farmácia Vida',           cnpj: '77.888.999/0001-38', status: 'Aprovado',     ia: 'Válida',   data: '12/04/2026', analista: 'Dra. Carla M.', tipo: 'Alvará Sanitário', docs: { alvara:'ok',  tecnico:'ok',   licenca:'ok'  }, obs: '' },
];

// ── Default notifications ──
const DEFAULT_NOTIFS = [
  { id:1, icon:'✅', title:'Processo aprovado',   msg:'Processo #2026-00123 (Restaurante Sabor Ltda) foi aprovado. Seu alvará está disponível para download.', time:'08/04/2026 14:22', type:'success', read:true,  proto:'#2026-00123' },
  { id:2, icon:'⚠️', title:'Correção necessária', msg:'Processo #2026-00125: Alvará anterior com data de validade expirada. Faça a correção para prosseguir.', time:'10/04/2026 09:15', type:'warn',    read:false, proto:'#2026-00125' },
  { id:3, icon:'🔍', title:'Processo em análise', msg:'Seu protocolo #2026-00124 foi recebido e está em análise pelo analista Dr. Bruno R.', time:'09/04/2026 11:03', type:'info', read:true,  proto:'#2026-00124' },
  { id:4, icon:'📅', title:'Vistoria agendada',   msg:'Uma vistoria foi agendada para o processo #2026-00126 em 22/04/2026 às 10:30.', time:'11/04/2026 16:45', type:'info',    read:false, proto:'#2026-00126' },
];


/* ══════════════════════════════════════════════
   LOGIN FLOW
══════════════════════════════════════════════ */

function showLogin(role) {
  pendingRole = role;
  document.getElementById('role-cards-step').style.display = 'none';
  const panel = document.getElementById('login-panel');
  panel.classList.add('visible');

  const isUser = role === 'user';
  document.getElementById('login-icon').textContent  = isUser ? '🏢' : '🔎';
  document.getElementById('login-title').textContent = isUser ? 'Usuário / Solicitante' : 'Analista Sanitário';
  document.getElementById('login-sub').textContent   = isUser ? 'Portal de envio de processos' : 'Painel de análise e aprovação';
  document.getElementById('hint-cred').textContent   = `${CREDENTIALS[role].email} / ${CREDENTIALS[role].senha}`;

  document.getElementById('login-email').value = '';
  document.getElementById('login-senha').value = '';
  document.getElementById('login-error').textContent = '';
  ['login-email','login-senha'].forEach(id => document.getElementById(id).classList.remove('input-error'));

  setTimeout(() => document.getElementById('login-email').focus(), 60);
}

function backToCards() {
  pendingRole = null;
  document.getElementById('login-panel').classList.remove('visible');
  document.getElementById('role-cards-step').style.display = '';
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const err   = document.getElementById('login-error');
  const cred  = CREDENTIALS[pendingRole];

  ['login-email','login-senha'].forEach(id => document.getElementById(id).classList.remove('input-error'));
  err.textContent = '';

  if (!email || !senha) {
    err.textContent = 'Preencha e-mail e senha.';
    if (!email) document.getElementById('login-email').classList.add('input-error');
    if (!senha) document.getElementById('login-senha').classList.add('input-error');
    return;
  }
  if (email !== cred.email || senha !== cred.senha) {
    err.textContent = 'E-mail ou senha incorretos.';
    document.getElementById('login-email').classList.add('input-error');
    document.getElementById('login-senha').classList.add('input-error');
    return;
  }
  setRole(pendingRole);
}


/* ══════════════════════════════════════════════
   APP SETUP
══════════════════════════════════════════════ */

function setRole(role) {
  currentRole = role;
  document.getElementById('role-switcher').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  if (!window._userNotifs) window._userNotifs = JSON.parse(JSON.stringify(DEFAULT_NOTIFS));
  renderApp();
}

function switchRole() {
  document.getElementById('role-switcher').style.display = '';
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-panel').classList.remove('visible');
  document.getElementById('role-cards-step').style.display = '';
  currentRole = null; pendingRole = null;
}

function renderApp() {
  const isUser = currentRole === 'user';
  document.getElementById('header-sub').textContent      = isUser ? 'Portal de Envio' : 'Painel do Analista';
  document.getElementById('header-info').textContent     = isUser ? 'Sistema de Licenciamento Sanitário' : 'Vigilância Sanitária — Painel de Controle';
  document.getElementById('header-avatar').textContent   = isUser ? 'US' : 'CM';
  document.getElementById('header-username').textContent = isUser ? 'João Solicitante' : 'Dra. Carla Mendes';
  document.getElementById('header-badge').textContent    = isUser ? 'Solicitante' : 'Analista';
  document.getElementById('header-badge').className      = 'header-role-badge ' + (isUser ? 'badge-user' : 'badge-analyst');
  renderSidebar();
  isUser ? renderUserHome() : renderAnalystDashboard();
}


/* ══════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════ */

function renderSidebar() {
  const isUser = currentRole === 'user';
  const items = isUser ? [
    { icon: iconHome(),     label: 'Início',          page: 'user-home',       active: true },
    { icon: iconSend(),     label: 'Novo Protocolo',  page: 'user-new' },
    { icon: iconList(),     label: 'Meus Processos',  page: 'user-processes' },
    { icon: iconBell(),     label: 'Notificações',    page: 'user-notif', badge: () => unreadCount() },
  ] : [
    { icon: iconHome(),     label: 'Dashboard',       page: 'analyst-dashboard', active: true },
    { icon: iconList(),     label: 'Processos',       page: 'analyst-processes', badge: '3' },
    { icon: iconCalendar(), label: 'Vistorias',       page: 'analyst-vistorias' },
    { icon: iconChart(),    label: 'Relatórios',      page: 'analyst-reports' },
    { icon: iconGear(),     label: 'Configurações',   page: 'analyst-config' },
  ];

  let html = `<div class="sidebar-section"><div class="sidebar-label">Menu principal</div>`;
  items.forEach((item, i) => {
    const badgeVal = typeof item.badge === 'function' ? item.badge() : item.badge;
    html += `<button class="nav-item${item.active ? ' active' : ''}" data-page="${item.page}" onclick="navTo('${item.page}',this)">
      ${item.icon} ${item.label}
      ${badgeVal ? `<span class="nav-badge">${badgeVal}</span>` : ''}
    </button>`;
  });
  html += '</div>';
  document.getElementById('sidebar').innerHTML = html;
}

function navTo(page, btn) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const pages = {
    'user-home':           renderUserHome,
    'user-new':            renderUserNew,
    'user-processes':      renderUserProcesses,
    'user-notif':          renderUserNotif,
    'analyst-dashboard':   renderAnalystDashboard,
    'analyst-processes':   renderAnalystProcesses,
    'analyst-vistorias':   renderAnalystVistorias,
    'analyst-reports':     renderAnalystReports,
    'analyst-config':      renderAnalystConfig,
  };
  if (pages[page]) pages[page]();
}

function unreadCount() {
  return (window._userNotifs || []).filter(n => !n.read).length || '';
}


/* ══════════════════════════════════════════════
   USER PAGES
══════════════════════════════════════════════ */

function renderUserHome() {
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Bem-vindo, João 👋</div>
      <div class="page-sub">Acompanhe seus processos e envie documentos para análise sanitária.</div>
    </div>

    <div class="metrics" style="grid-template-columns:repeat(3,1fr)">
      <div class="metric blue">
        <div class="metric-label">Total enviados</div>
        <div class="metric-value">3</div>
        <div class="metric-sub">desde jan/2026</div>
      </div>
      <div class="metric amber">
        <div class="metric-label">Em análise</div>
        <div class="metric-value">1</div>
        <div class="metric-sub">aguardando revisão</div>
      </div>
      <div class="metric green">
        <div class="metric-label">Aprovados</div>
        <div class="metric-value">1</div>
        <div class="metric-sub">documentos válidos</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div>
          <div class="card-title">${iconList()} Meus Processos</div>
          <div class="card-sub">Últimas atualizações</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="navTo('user-new',null)">${iconSend()} Novo Protocolo</button>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Protocolo</th><th>Tipo</th><th>Data</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              <tr>
                <td><code class="proto">#2026-00123</code></td>
                <td>Alvará Sanitário</td><td>08/04/2026</td>
                <td>${statusBadge('Aprovado')}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="openProcessDetail(0)">Ver detalhes</button></td>
              </tr>
              <tr>
                <td><code class="proto">#2026-00125</code></td>
                <td>Novo processo</td><td>10/04/2026</td>
                <td>${statusBadge('Com erro')}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="openProcessDetail(2)">Corrigir</button></td>
              </tr>
              <tr>
                <td><code class="proto">#2026-00124</code></td>
                <td>Renovação</td><td>09/04/2026</td>
                <td>${statusBadge('Em análise')}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="openProcessDetail(1)">Acompanhar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="flag info">
      ${iconInfo()} <div><strong>Dica:</strong> Clique em <strong>Novo Protocolo</strong> para simular o envio completo com validação por IA.</div>
    </div>
  `;
}

// ── New protocol ──
function renderUserNew() {
  window._uploads = {};
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Novo Protocolo</div>
      <div class="page-sub">Preencha os dados e envie os documentos para análise sanitária.</div>
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
        ${uploadZone('alvara',  '📄', 'Alvará Anterior',    'PDF, máx. 5MB')}
        ${uploadZone('tecnico', '📋', 'Documento Técnico',  'PDF, máx. 5MB')}
        ${uploadZone('licenca', '🏥', 'Licença Sanitária',  'PDF, máx. 5MB')}
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
      <button class="btn btn-ghost" onclick="renderUserHome()">Cancelar</button>
      <button class="btn btn-primary" onclick="submitProcess()">${iconSend()} Enviar para Análise</button>
    </div>
  `;
}

function uploadZone(type, emoji, label, hint) {
  return `<div class="upload-zone" id="zone-${type}">
    <input type="file" accept=".pdf" onchange="handleFileInput(event,'${type}')">
    <div class="upload-info">
      <div class="upload-icon doc">${emoji}</div>
      <div><div class="upload-name">${label}</div><div class="upload-hint">${hint}</div></div>
    </div>
    <button class="btn btn-ghost btn-sm" type="button" onclick="event.stopPropagation()">${iconUpload()} Selecionar</button>
  </div>`;
}

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
  runAIValidation();
}

function runAIValidation() {
  const card = document.getElementById('ai-validation-card');
  card.style.display = '';
  document.getElementById('ai-loading').style.display = '';
  document.getElementById('ai-results').innerHTML = '<div style="color:var(--gray-400);font-size:13px;padding:4px 0">Analisando documentos com IA…</div>';

  setTimeout(() => {
    const ups = window._uploads || {};
    document.getElementById('ai-loading').style.display = 'none';
    let rows = '';
    if (ups.alvara)  rows += aiRow('ok',   'Alvará Anterior',   'Documento identificado e válido. Validade verificada: dez/2026.');
    else             rows += aiRow('warn',  'Alvará Anterior',   'Documento não enviado ainda.');
    if (ups.tecnico) rows += aiRow('warn',  'Documento Técnico', 'Campo "Responsável" está incompleto ou ilegível.');
    else             rows += aiRow('warn',  'Documento Técnico', 'Documento não enviado ainda.');
    if (ups.licenca) rows += aiRow('ok',    'Licença Sanitária', 'Documento válido, sem inconsistências detectadas.');
    else             rows += aiRow('error', 'Licença Sanitária', 'Documento obrigatório não enviado.');
    document.getElementById('ai-results').innerHTML = `
      <div class="ai-box">
        <div class="ai-header">${iconAI()} <span class="ai-title">Resultado da Validação Automática</span></div>
        ${rows}
      </div>
    `;
  }, 1800);
}

function aiRow(type, label, msg) {
  const cls  = type === 'ok' ? 'ok-item' : type === 'error' ? 'error-item' : 'warn';
  const icon = type === 'ok' ? iconCheckGreen() : type === 'error' ? iconX() : iconWarn();
  return `<div class="ai-item ${cls}">${icon} <div><strong>${label}</strong> — ${msg}</div></div>`;
}

function submitProcess() {
  const nome = document.getElementById('nome-empresa')?.value.trim();
  const cnpj = document.getElementById('cnpj')?.value.trim();
  if (!nome || !cnpj) { showToast('Preencha os campos obrigatórios.', 'error-t', '⚠️'); return; }
  showToast('Protocolo #2026-00128 enviado com sucesso!', 'success', '✅');
  setTimeout(() => {
    ['tc1','tc2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = 'track-circle done';
    });
    const tl = document.getElementById('tl1');
    if (tl) tl.classList.add('done');
  }, 500);
}

// ── My processes ──
function renderUserProcesses() {
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Meus Processos</div>
      <div class="page-sub">Histórico completo de solicitações.</div>
    </div>
    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Protocolo</th><th>Empresa</th><th>Tipo</th><th>Data</th><th>Status</th><th>IA</th><th>Ação</th></tr></thead>
            <tbody>
              ${processes.map((p, i) => `<tr>
                <td><code class="proto">${p.id}</code></td>
                <td>${p.empresa}</td>
                <td>${p.tipo}</td>
                <td>${p.data}</td>
                <td>${statusBadge(p.status)}</td>
                <td>${iaBadge(p.ia)}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="openProcessDetail(${i})">Ver</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ── Notifications ──
function renderUserNotif() {
  if (!window._userNotifs) window._userNotifs = JSON.parse(JSON.stringify(DEFAULT_NOTIFS));
  const notifs = window._userNotifs;
  const unread = notifs.filter(n => !n.read).length;

  document.getElementById('content').innerHTML = `
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between">
      <div>
        <div class="page-title">Notificações ${unread > 0 ? `<span style="font-size:14px;background:var(--red);color:white;border-radius:20px;padding:2px 10px;vertical-align:middle;margin-left:4px">${unread}</span>` : ''}</div>
        <div class="page-sub">Atualizações sobre seus processos.</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="markAllRead()">Marcar todas como lidas</button>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap" id="notif-filters">
      <button class="btn btn-primary btn-sm" style="border-radius:20px" onclick="filterNotifs('all',this)">Todas</button>
      <button class="btn btn-ghost btn-sm"   style="border-radius:20px" onclick="filterNotifs('unread',this)">Não lidas</button>
      <button class="btn btn-ghost btn-sm"   style="border-radius:20px" onclick="filterNotifs('success',this)">✅ Aprovadas</button>
      <button class="btn btn-ghost btn-sm"   style="border-radius:20px" onclick="filterNotifs('warn',this)">⚠️ Correções</button>
      <button class="btn btn-ghost btn-sm"   style="border-radius:20px" onclick="filterNotifs('info',this)">🔍 Informativas</button>
    </div>

    <div id="notif-list" style="display:flex;flex-direction:column;gap:10px">
      ${notifs.map(n => renderNotifCard(n)).join('')}
    </div>

    <div style="margin-top:24px">
      <div class="card">
        <div class="card-header"><div class="card-title">📧 Preferências de Notificação</div></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:0">
            ${[
              { label:'Processo aprovado',   sub:'Receber e-mail quando aprovado',              on:true  },
              { label:'Correção necessária', sub:'Receber e-mail quando solicitada uma correção', on:true  },
              { label:'Processo em análise', sub:'Receber e-mail ao iniciar a revisão',           on:false },
              { label:'Vistoria agendada',   sub:'Receber e-mail ao marcar vistoria',             on:true  },
            ].map((p, i) => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--gray-50)">
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--gray-800)">${p.label}</div>
                  <div style="font-size:12px;color:var(--gray-400);margin-top:2px">${p.sub}</div>
                </div>
                <div class="toggle-track ${p.on ? 'on' : ''}" onclick="togglePref(this)" role="switch" aria-checked="${p.on}">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:18px">
            <label class="form-label">E-mail para notificações</label>
            <div style="display:flex;gap:8px">
              <input class="form-input" value="empresa@email.com" style="flex:1">
              <button class="btn btn-primary" onclick="showToast('E-mail atualizado!','success','✅')">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNotifCard(n) {
  const unreadClass = !n.read ? `unread type-${n.type}` : '';
  return `<div id="notif-${n.id}" data-type="${n.type}" data-read="${n.read}"
    class="notif-card ${unreadClass}">
    <span style="font-size:22px;flex-shrink:0;margin-top:2px">${n.icon}</span>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-size:13px;font-weight:700;color:var(--gray-900)">${n.title}</span>
        ${!n.read ? '<span style="width:7px;height:7px;border-radius:50%;background:var(--brand);flex-shrink:0"></span>' : ''}
        <span style="font-size:11px;color:var(--gray-400);margin-left:auto">${n.time}</span>
      </div>
      <div style="font-size:13px;color:var(--gray-600);line-height:1.55">${n.msg}</div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="openProcessFromNotif('${n.proto}')">Ver processo</button>
        ${!n.read ? `<button class="btn btn-ghost btn-sm" onclick="markOneRead(${n.id})">Marcar como lida</button>` : ''}
      </div>
    </div>
  </div>`;
}

function markAllRead() {
  (window._userNotifs || []).forEach(n => n.read = true);
  showToast('Todas as notificações marcadas como lidas.', 'success', '✅');
  renderUserNotif(); updateNotifBadge();
}
function markOneRead(id) {
  const n = (window._userNotifs || []).find(x => x.id === id);
  if (n) n.read = true;
  renderUserNotif(); updateNotifBadge();
}
function filterNotifs(type, btn) {
  document.querySelectorAll('#notif-filters button').forEach(b => { b.className = 'btn btn-ghost btn-sm'; b.style.borderRadius = '20px'; });
  btn.className = 'btn btn-primary btn-sm'; btn.style.borderRadius = '20px';
  document.querySelectorAll('#notif-list .notif-card').forEach(el => {
    if (type === 'all')    el.style.display = '';
    else if (type === 'unread') el.style.display = el.dataset.read === 'false' ? '' : 'none';
    else el.style.display = el.dataset.type === type ? '' : 'none';
  });
}
function togglePref(el) {
  el.classList.toggle('on');
  showToast('Preferência salva!', 'success', '✅');
}
function updateNotifBadge() {
  const cnt = unreadCount();
  const badge = document.querySelector('.nav-item[data-page="user-notif"] .nav-badge');
  if (badge) badge.textContent = cnt || '';
}
function openProcessFromNotif(proto) {
  const idx = processes.findIndex(p => p.id === proto);
  if (idx >= 0) openProcessDetail(idx);
}
function pushUserNotif(notif) {
  if (!window._userNotifs) window._userNotifs = [];
  window._userNotifs.unshift(notif);
}


/* ══════════════════════════════════════════════
   ANALYST PAGES
══════════════════════════════════════════════ */

function renderAnalystDashboard() {
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Dashboard do Analista</div>
      <div class="page-sub">Visão geral dos processos em andamento — Abril 2026.</div>
    </div>

    <div class="metrics">
      <div class="metric amber"><div class="metric-label">⏳ Pendentes</div><div class="metric-value">23</div><div class="metric-sub">aguardando análise</div></div>
      <div class="metric blue"><div class="metric-label">🔍 Em análise</div><div class="metric-value">12</div><div class="metric-sub">em revisão ativa</div></div>
      <div class="metric green"><div class="metric-label">✓ Aprovados</div><div class="metric-value">45</div><div class="metric-sub">este mês</div></div>
      <div class="metric red"><div class="metric-label">⚠ Com erro</div><div class="metric-value">8</div><div class="metric-sub">requerem correção</div></div>
    </div>

    <div class="grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Taxa de aprovação</div></div>
          <span style="font-size:22px;font-weight:700;color:var(--green)">73%</span>
        </div>
        <div class="card-body">
          <div class="progress-bar" style="margin-bottom:8px"><div class="progress-fill green" style="width:73%"></div></div>
          <div style="font-size:12px;color:var(--gray-400)">Meta mensal: <strong>80%</strong> · Restam 7 pontos percentuais</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Tempo médio de análise</div></div>
          <span style="font-size:22px;font-weight:700;color:var(--brand)">3.2d</span>
        </div>
        <div class="card-body">
          <div class="progress-bar" style="margin-bottom:8px"><div class="progress-fill blue" style="width:64%"></div></div>
          <div style="font-size:12px;color:var(--gray-400)">Meta: <strong>≤ 5 dias úteis</strong> · Dentro do prazo</div>
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
          <table>
            <thead><tr><th>Protocolo</th><th>Empresa</th><th>CNPJ</th><th>Status</th><th>Validação IA</th><th>Ação</th></tr></thead>
            <tbody>
              ${processes.map((p, i) => `<tr>
                <td><code class="proto">${p.id}</code></td>
                <td style="font-weight:500">${p.empresa}</td>
                <td style="color:var(--gray-400);font-size:12px;font-family:'JetBrains Mono',monospace">${p.cnpj}</td>
                <td>${statusBadge(p.status)}</td>
                <td>${iaBadge(p.ia)}</td>
                <td><button class="btn btn-primary btn-sm" onclick="openAnalystModal(${i})">Abrir</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAnalystProcesses() {
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Lista de Processos</div>
      <div class="page-sub">Gerencie todos os processos ativos.</div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-body" style="display:flex;gap:12px;align-items:center">
        <input class="form-input" style="max-width:300px" placeholder="🔍 Buscar empresa, CNPJ ou protocolo…" oninput="filterTable(this.value, null)">
        <select class="form-select" style="max-width:190px" onchange="filterTable(null, this.value)">
          <option value="">Todos os status</option>
          <option>Pendente</option><option>Em análise</option><option>Aprovado</option><option>Com erro</option><option>Ag. correção</option>
        </select>
      </div>
    </div>
    <div class="card">
      <div class="card-body" style="padding:0">
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
                <td style="font-size:12px;color:var(--gray-500)">${p.analista}</td>
                <td><button class="btn btn-primary btn-sm" onclick="openAnalystModal(${i})">Abrir</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
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

function renderAnalystVistorias() {
  const vistorias = [
    { data:'15/04/2026', hora:'09:00', empresa:'Restaurante Sabor Ltda', end:'Rua das Flores, 123 — Centro', analista:'Dra. Carla M.' },
    { data:'17/04/2026', hora:'14:00', empresa:'Farmácia Vida',          end:'Av. Brasil, 456 — Zona Norte', analista:'Dr. Bruno R.' },
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
        return `<div class="vistoria-card">
          <div class="vistoria-date-block">
            <div class="vistoria-day">${d}</div>
            <div class="vistoria-month">${months[parseInt(m)]}</div>
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

function renderAnalystReports() {
  const byStatus = {
    Aprovado: processes.filter(p => p.status === 'Aprovado').length,
    Pendente: processes.filter(p => p.status === 'Pendente').length,
    'Em análise': processes.filter(p => p.status === 'Em análise').length,
    'Com erro': processes.filter(p => p.status === 'Com erro').length,
    'Ag. correção': processes.filter(p => p.status === 'Ag. correção').length,
  };
  const total = processes.length;

  document.getElementById('content').innerHTML = `
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <div class="page-title">Relatórios</div>
        <div class="page-sub">Análise consolidada dos processos sanitários — Abril 2026.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <select class="form-select" style="width:170px" onchange="showToast('Período atualizado!','success','📅')">
          <option>Abril 2026</option><option>Março 2026</option><option>Fevereiro 2026</option><option>Jan–Abr 2026</option>
        </select>
        <button class="btn btn-primary" onclick="showToast('Relatório enviado ao seu e-mail!','success','📧')">
          ${iconUpload()} Exportar PDF
        </button>
      </div>
    </div>

    <div class="metrics" style="margin-bottom:20px">
      <div class="metric blue"><div class="metric-label">📋 Total de processos</div><div class="metric-value">${total + 83}</div><div class="metric-sub">em 2026</div></div>
      <div class="metric green"><div class="metric-label">✓ Taxa de aprovação</div><div class="metric-value">73%</div><div class="metric-sub">meta: 80%</div></div>
      <div class="metric amber"><div class="metric-label">⏱ Tempo médio</div><div class="metric-value">3.2d</div><div class="metric-sub">meta: ≤5 dias</div></div>
      <div class="metric red"><div class="metric-label">⚠ Taxa de erro</div><div class="metric-value">18%</div><div class="metric-sub">doc. rejeitados</div></div>
    </div>

    <div class="grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header"><div class="card-title">Processos por status</div><div class="card-sub">Distribuição atual</div></div>
        <div class="card-body">
          <canvas id="chart-status" width="300" height="220"></canvas>
          <div class="chart-legend" id="status-legend"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Processos por mês</div><div class="card-sub">Jan–Abr 2026</div></div>
        <div class="card-body">
          <canvas id="chart-monthly" width="300" height="220"></canvas>
          <div class="chart-legend">
            <div class="chart-legend-item"><div class="chart-legend-dot" style="background:#bfdbfe"></div>Total</div>
            <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--green-mid)"></div>Aprovados</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header"><div class="card-title">Documentos mais rejeitados</div></div>
        <div class="card-body">
          ${[
            { doc:'Alvará Anterior',    pct:48, color:'var(--red)' },
            { doc:'Documento Técnico',  pct:31, color:'var(--amber)' },
            { doc:'Licença Sanitária',  pct:21, color:'var(--brand)' },
          ].map(d => `<div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
              <span style="font-weight:500">${d.doc}</span>
              <span style="font-weight:700;color:${d.color}">${d.pct}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${d.pct}%;background:${d.color}"></div></div>
          </div>`).join('')}
          <div class="flag warn" style="margin-top:4px;font-size:12px">${iconWarn()} Validade expirada é a causa mais frequente de rejeição.</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Desempenho por analista</div></div>
        <div class="card-body" style="padding:0">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Analista</th><th>Processos</th><th>Aprovados</th><th>T. Médio</th></tr></thead>
              <tbody>
                <tr><td style="font-weight:500">Dra. Carla M.</td><td>31</td><td style="color:var(--green);font-weight:700">26</td><td>2.8d</td></tr>
                <tr><td style="font-weight:500">Dr. Bruno R.</td><td>24</td><td style="color:var(--green);font-weight:700">18</td><td>3.9d</td></tr>
                <tr><td style="font-weight:500">Dr. Marcos T.</td><td>17</td><td style="color:var(--green);font-weight:700">11</td><td>4.1d</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => drawReportCharts(byStatus), 50);
}

function drawReportCharts(byStatus) {
  // Donut chart
  const c1 = document.getElementById('chart-status');
  if (!c1) return;
  const ctx1 = c1.getContext('2d');
  const labels = Object.keys(byStatus);
  const values = Object.values(byStatus);
  const colors = ['#0a7c5c','#b45309','#1a6ab5','#c0392b','#6b7185'];
  const total  = values.reduce((a,b) => a+b, 0) || 1;
  let angle = -Math.PI / 2;
  const cx = c1.width/2, cy = c1.height/2, r = Math.min(cx,cy) - 18, ir = r * 0.56;
  ctx1.clearRect(0,0,c1.width,c1.height);
  values.forEach((v, i) => {
    const slice = (v / total) * Math.PI * 2;
    ctx1.beginPath(); ctx1.moveTo(cx,cy); ctx1.arc(cx,cy,r,angle,angle+slice);
    ctx1.closePath(); ctx1.fillStyle = colors[i]; ctx1.fill();
    angle += slice;
  });
  ctx1.beginPath(); ctx1.arc(cx,cy,ir,0,Math.PI*2);
  ctx1.fillStyle = 'white'; ctx1.fill();
  ctx1.fillStyle = '#12152b'; ctx1.font = 'bold 22px Sora,sans-serif';
  ctx1.textAlign = 'center'; ctx1.textBaseline = 'middle';
  ctx1.fillText(total, cx, cy - 8);
  ctx1.font = '11px Sora,sans-serif'; ctx1.fillStyle = '#9399aa';
  ctx1.fillText('processos', cx, cy + 11);

  const leg = document.getElementById('status-legend');
  if (leg) {
    leg.innerHTML = labels.map((l,i) => `
      <div class="chart-legend-item">
        <div class="chart-legend-dot" style="background:${colors[i]}"></div>
        ${l}: <strong>${values[i]}</strong>
      </div>`).join('');
  }

  // Bar chart
  const c2 = document.getElementById('chart-monthly');
  if (!c2) return;
  const ctx2 = c2.getContext('2d');
  const months = ['Jan','Fev','Mar','Abr'];
  const data     = [18,22,26,22];
  const approved = [14,17,20,16];
  const w = c2.width, h = c2.height;
  const pad = { t:12, b:28, l:28, r:8 };
  const maxV = Math.max(...data) + 6;
  const chartW = w - pad.l - pad.r;
  const chartH = h - pad.t - pad.b;
  ctx2.clearRect(0,0,w,h);

  [0, 0.25, 0.5, 0.75, 1].forEach(f => {
    const y = pad.t + chartH * (1 - f);
    ctx2.strokeStyle = '#eef0f4'; ctx2.lineWidth = 1;
    ctx2.beginPath(); ctx2.moveTo(pad.l, y); ctx2.lineTo(w-pad.r, y); ctx2.stroke();
    if (f > 0) {
      ctx2.fillStyle = '#9399aa'; ctx2.font = '10px Sora,sans-serif';
      ctx2.textAlign = 'right'; ctx2.fillText(Math.round(f * maxV), pad.l - 5, y + 4);
    }
  });

  const bw = chartW / months.length;
  data.forEach((v, i) => {
    const x = pad.l + i * bw + bw * 0.1;
    const bSize = bw * 0.33;
    const barH1 = (v / maxV) * chartH;
    const barH2 = (approved[i] / maxV) * chartH;
    const y1 = pad.t + chartH - barH1;
    const y2 = pad.t + chartH - barH2;
    ctx2.fillStyle = '#bfdbfe';
    if (ctx2.roundRect) ctx2.roundRect(x, y1, bSize, barH1, [3,3,0,0]);
    else ctx2.rect(x, y1, bSize, barH1);
    ctx2.fill();
    ctx2.fillStyle = '#0a7c5c';
    if (ctx2.roundRect) ctx2.roundRect(x + bSize + 4, y2, bSize, barH2, [3,3,0,0]);
    else ctx2.rect(x + bSize + 4, y2, bSize, barH2);
    ctx2.fill();
    ctx2.fillStyle = '#6b7185'; ctx2.font = '11px Sora,sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(months[i], x + bSize, h - pad.b + 14);
  });
}

function renderAnalystConfig() {
  document.getElementById('content').innerHTML = `
    <div class="page-header"><div class="page-title">Configurações</div><div class="page-sub">Gerencie seu perfil de analista.</div></div>
    <div class="card">
      <div class="card-header"><div class="card-title">${iconUser()} Perfil do Analista</div></div>
      <div class="card-body">
        <div class="form-row" style="margin-bottom:0">
          <div class="form-group"><label class="form-label">Nome completo</label><input class="form-input" value="Dra. Carla Mendes"></div>
          <div class="form-group"><label class="form-label">CRF / Registro</label><input class="form-input" value="CRF-PR 12345"></div>
        </div>
        <div class="form-row" style="margin-bottom:0">
          <div class="form-group"><label class="form-label">E-mail institucional</label><input class="form-input" value="carla.mendes@vigilancia.pr.gov.br"></div>
          <div class="form-group"><label class="form-label">Setor</label><input class="form-input" value="Vigilância Sanitária – Norte"></div>
        </div>
        <div style="margin-top:8px">
          <button class="btn btn-primary" onclick="showToast('Configurações salvas!','success','✅')">Salvar alterações</button>
        </div>
      </div>
    </div>
  `;
}


/* ══════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════ */

function openProcessDetail(idx) {
  const p = processes[idx];
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Processo <code class="proto">${p.id}</code></div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="detail-panel">
        <div>
          <div class="detail-label">Informações</div>
          <div class="detail-row"><span class="detail-key">Empresa</span><span class="detail-val">${p.empresa}</span></div>
          <div class="detail-row"><span class="detail-key">CNPJ</span><span class="detail-val" style="font-family:'JetBrains Mono',monospace;font-size:12px">${p.cnpj}</span></div>
          <div class="detail-row"><span class="detail-key">Tipo</span><span class="detail-val">${p.tipo}</span></div>
          <div class="detail-row"><span class="detail-key">Data de envio</span><span class="detail-val">${p.data}</span></div>
          <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val">${statusBadge(p.status)}</span></div>
        </div>
        <div>
          <div class="detail-label">Documentos Enviados</div>
          <div class="detail-row"><span class="detail-key">Alvará Anterior</span><span class="detail-val">${docChip(p.docs.alvara)}</span></div>
          <div class="detail-row"><span class="detail-key">Doc. Técnico</span><span class="detail-val">${docChip(p.docs.tecnico)}</span></div>
          <div class="detail-row"><span class="detail-key">Licença Sanitária</span><span class="detail-val">${docChip(p.docs.licenca)}</span></div>
          <div class="detail-row"><span class="detail-key">Validação IA</span><span class="detail-val">${iaBadge(p.ia)}</span></div>
        </div>
      </div>
      ${p.obs ? `<div style="margin-top:20px"><div class="detail-label">Observações do Analista</div><div class="flag warn" style="margin-top:8px">${iconWarn()} ${p.obs}</div></div>` : ''}
      <div style="margin-top:20px">
        <div class="detail-label">Acompanhamento</div>
        <div class="track" style="margin:14px 0">
          ${trackStep('done',  '✓', 'Enviado')}
          ${trackLine(['Em análise','Ag. correção','Aprovado'].includes(p.status))}
          ${trackStep(p.status === 'Em análise' ? 'active' : ['Ag. correção','Aprovado'].includes(p.status) ? 'done' : 'wait', '2', 'Em Análise')}
          ${trackLine(['Ag. correção','Aprovado'].includes(p.status))}
          ${trackStep(p.status === 'Ag. correção' ? 'alert' : p.status === 'Aprovado' ? 'done' : 'wait', '⚠', 'Correção')}
          ${trackLine(p.status === 'Aprovado')}
          ${trackStep('wait', '📅', 'Vistoria')}
          ${trackLine(p.status === 'Aprovado')}
          ${trackStep(p.status === 'Aprovado' ? 'done' : 'wait', '✓', 'Aprovado')}
        </div>
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Fechar</button></div>
  `;
  openModal();
}

function openAnalystModal(idx) {
  const p = processes[idx];
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Analisar — <code class="proto">${p.id}</code></div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="detail-panel">
        <div>
          <div class="detail-label">Processo</div>
          <div class="detail-row"><span class="detail-key">Empresa</span><span class="detail-val">${p.empresa}</span></div>
          <div class="detail-row"><span class="detail-key">CNPJ</span><span class="detail-val" style="font-family:'JetBrains Mono',monospace;font-size:12px">${p.cnpj}</span></div>
          <div class="detail-row"><span class="detail-key">Tipo</span><span class="detail-val">${p.tipo}</span></div>
          <div class="detail-row"><span class="detail-key">Data</span><span class="detail-val">${p.data}</span></div>
          <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val">${statusBadge(p.status)}</span></div>
        </div>
        <div>
          <div class="detail-label">Documentos</div>
          <div class="detail-row"><span class="detail-key">Alvará Anterior</span><span class="detail-val">${docChip(p.docs.alvara)}</span></div>
          <div class="detail-row"><span class="detail-key">Doc. Técnico</span><span class="detail-val">${docChip(p.docs.tecnico)}</span></div>
          <div class="detail-row"><span class="detail-key">Licença Sanitária</span><span class="detail-val">${docChip(p.docs.licenca)}</span></div>
        </div>
      </div>
      <div style="margin-top:18px">
        <div class="detail-label">Resultado da Validação por IA</div>
        <div class="flag ${p.ia === 'Válida' ? 'success' : 'warn'}" style="margin-top:8px">
          ${p.ia === 'Válida' ? iconCheckGreen() + ' Todos os documentos estão de acordo com os requisitos sanitários.' : iconWarn() + ' ' + p.obs}
        </div>
      </div>
      <div style="margin-top:18px">
        <label class="form-label">Observações do Analista</label>
        <textarea id="obs-input" rows="3" placeholder="Adicione observações técnicas aqui…">${p.obs}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-success"  onclick="analystAction('approve',${idx})">${iconCheck()} Aprovar</button>
      <button class="btn btn-ghost"    onclick="analystAction('correction',${idx})">${iconWarn()} Solicitar Correção</button>
      <button class="btn btn-ghost"    onclick="analystAction('vistoria',${idx})">📅 Agendar Vistoria</button>
      <button class="btn btn-danger"   onclick="analystAction('reject',${idx})">Reprovar</button>
      <button class="btn btn-ghost"    onclick="closeModal()" style="margin-left:auto">Cancelar</button>
    </div>
  `;
  openModal();
}

function analystAction(action, idx) {
  const obs = document.getElementById('obs-input')?.value || '';
  processes[idx].obs = obs;
  const p = processes[idx];
  const ts = new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const map = {
    approve:    { icon:'✅', title:'Processo aprovado',   type:'success', status:'Aprovado',     toast:'Processo aprovado! Empresa notificada.', msg:`Processo ${p.id} (${p.empresa}) foi aprovado pela analista Dra. Carla Mendes. Seu alvará sanitário está disponível.` },
    correction: { icon:'⚠️', title:'Correção necessária', type:'warn',    status:'Ag. correção', toast:'Correção solicitada. Empresa notificada.', msg:`Processo ${p.id}: Correção solicitada. Motivo: ${obs || 'Documentação incompleta.'}` },
    vistoria:   { icon:'📅', title:'Vistoria agendada',   type:'info',    status:'Em análise',   toast:'Vistoria agendada. Empresa notificada.', msg:`Uma vistoria foi agendada para o processo ${p.id} (${p.empresa}).` },
    reject:     { icon:'❌', title:'Processo reprovado',  type:'warn',    status:'Com erro',     toast:'Processo reprovado. Empresa notificada.', msg:`Processo ${p.id} foi reprovado. Motivo: ${obs || 'Documentação não atende aos requisitos.'}` },
  };

  const act = map[action];
  if (act) {
    processes[idx].status = act.status;
    pushUserNotif({ id:Date.now(), icon:act.icon, title:act.title, msg:act.msg, time:ts, type:act.type, read:false, proto:p.id });
    showToast(act.toast, 'success', act.icon);
  }
  closeModal();
  renderAnalystDashboard();
}

function trackStep(cls, label, text) {
  return `<div class="track-step"><div class="track-circle ${cls}">${label}</div><div class="track-label">${text}</div></div>`;
}
function trackLine(done) {
  return `<div class="track-line${done ? ' done' : ''}"></div>`;
}

function openModal()  { document.getElementById('modal').classList.add('open'); }
function closeModal() { document.getElementById('modal').classList.remove('open'); }
document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });


/* ══════════════════════════════════════════════
   HELPERS & ICONS
══════════════════════════════════════════════ */

function statusBadge(s) {
  const map = { 'Pendente':'badge-pending', 'Em análise':'badge-analysis', 'Aprovado':'badge-approved', 'Com erro':'badge-error', 'Ag. correção':'badge-wait' };
  return `<span class="badge ${map[s] || ''}">${s}</span>`;
}
function iaBadge(v) {
  return v === 'Válida'
    ? '<span class="chip chip-valid">✓ Válida</span>'
    : '<span class="chip chip-invalid">✕ Inválida</span>';
}
function docChip(v) {
  if (v === 'ok')   return '<span class="chip chip-valid">✓ OK</span>';
  if (v === 'warn') return `<span style="color:var(--amber);font-size:12px;font-weight:600">⚠ Atenção</span>`;
  return '<span class="chip chip-invalid">✕ Erro</span>';
}

function showToast(msg, type = '', icon = '') {
  const t   = document.getElementById('toast');
  const ico = document.getElementById('toast-icon');
  const txt = document.getElementById('toast-msg');
  ico.textContent = icon;
  txt.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

function maskCNPJ(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/^(\d{2})(\d)/,               '$1.$2');
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/,      '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/,              '.$1/$2');
  v = v.replace(/(\d{4})(\d)/,                '$1-$2');
  input.value = v;
}

// Icons
const svg = (d, w=16, h=16) => `<svg viewBox="0 0 20 20" fill="currentColor" width="${w}" height="${h}"><path d="${d}"/></svg>`;
const svgRule = (d, w=16, h=16) => `<svg viewBox="0 0 20 20" fill="currentColor" width="${w}" height="${h}"><path fill-rule="evenodd" clip-rule="evenodd" d="${d}"/></svg>`;

function iconHome()       { return svgRule('M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z'); }
function iconSend()       { return svg('M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'); }
function iconList()       { return svgRule('M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'); }
function iconBell()       { return svg('M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z'); }
function iconCalendar()   { return svgRule('M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'); }
function iconChart()      { return svg('M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z'); }
function iconGear()       { return svgRule('M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'); }
function iconUpload()     { return svgRule('M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z'); }
function iconUser()       { return svgRule('M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'); }
function iconCheck()      { return svgRule('M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'); }
function iconCheckGreen() { return `<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style="color:var(--green-mid)"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`; }
function iconWarn()       { return `<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style="color:var(--amber)"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`; }
function iconX()          { return `<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style="color:var(--red)"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`; }
function iconInfo()       { return `<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`; }
function iconAI()         { return `<svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style="color:var(--violet)"><path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clip-rule="evenodd"/></svg>`; }