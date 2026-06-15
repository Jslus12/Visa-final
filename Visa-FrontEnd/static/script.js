'use strict';

/* ══════════════════════════════════════════════
   VIGILÂNCIANET — Application Logic (Analista)
══════════════════════════════════════════════ */

const CREDENTIALS = {
  analyst: { email: 'analista@vigilancia.pr', senha: '123456' },
};

const processes = [
  { id: '#2026-00123', empresa: 'Restaurante Sabor Ltda',  cnpj: '12.345.678/0001-90', status: 'Aprovado',     ia: 'Válida',   data: '08/04/2026', analista: 'Dra. Carla M.', tipo: 'Alvará Sanitário', docs: { alvara:'ok',  tecnico:'ok',   licenca:'ok'  }, obs: '' },
  { id: '#2026-00124', empresa: 'Mercado Bom Preço',       cnpj: '98.765.432/0001-19', status: 'Em análise',   ia: 'Válida',   data: '09/04/2026', analista: 'Dr. Bruno R.',  tipo: 'Renovação',       docs: { alvara:'ok',  tecnico:'warn', licenca:'ok'  }, obs: 'Documento técnico com campo responsável incompleto.' },
  { id: '#2026-00125', empresa: 'Padaria Doce Pão',        cnpj: '11.222.333/0001-81', status: 'Com erro',     ia: 'Válida',   data: '10/04/2026', analista: 'Dra. Carla M.', tipo: 'Novo',            docs: { alvara:'err', tecnico:'ok',   licenca:'ok'  }, obs: 'Alvará anterior com data de validade expirada.' },
  { id: '#2026-00126', empresa: 'Clínica Saúde+',          cnpj: '44.555.888/0001-28', status: 'Ag. correção', ia: 'Inválida', data: '11/04/2026', analista: 'Dr. Bruno R.',  tipo: 'Renovação',       docs: { alvara:'ok',  tecnico:'err',  licenca:'ok'  }, obs: 'Responsável técnico não está cadastrado no CRM.' },
  { id: '#2026-00127', empresa: 'Farmácia Vida',           cnpj: '77.888.999/0001-38', status: 'Aprovado',     ia: 'Válida',   data: '12/04/2026', analista: 'Dra. Carla M.', tipo: 'Alvará Sanitário', docs: { alvara:'ok',  tecnico:'ok',   licenca:'ok'  }, obs: '' },
];

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
    const resposta = await fetch("http://localhost:8080/api/login", {
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
   APP SETUP
══════════════════════════════════════════════ */

function setRole() {
  document.getElementById('role-switcher').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  renderApp();
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

function renderApp() {
  renderSidebar();
  renderAnalystDashboard();
}

/* ══════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════ */

function renderSidebar() {
  const items = [
    { icon: iconHome(),     label: 'Dashboard',        page: 'analyst-dashboard', active: true },
    { icon: iconSend(),     label: 'Novo Protocolo',   page: 'analyst-new' },
    { icon: iconList(),     label: 'Processos',        page: 'analyst-processes', badge: '3' },
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

function navTo(page, btn) {
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
  if (pages[page]) pages[page]();
}

/* ══════════════════════════════════════════════
   DASHBOARD
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
          <div style="font-size:12px;color:var(--gray-400)">Meta: <strong>&le; 5 dias úteis</strong> · Dentro do prazo</div>
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

/* ══════════════════════════════════════════════
   NOVO PROTOCOLO
══════════════════════════════════════════════ */

function renderAnalystNew() {
  window._uploads = {};
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
    if (ups.alvara)  rows += aiRow('ok',    'Alvará Anterior',   'Documento identificado e válido. Validade verificada: dez/2026.');
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
  showToast('Protocolo #2026-00128 registrado com sucesso!', 'success', '✅');
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
function openAnalystModal(index) { console.log('Abrindo processo: ', index); }
function showToast(msg, type, icon) { console.log(`${icon} [${type.toUpperCase()}] ${msg}`); }
function renderAnalystReports() { document.getElementById('content').innerHTML = '<h3>Relatórios</h3>'; }
function renderAnalystConfig() { document.getElementById('content').innerHTML = '<h3>Configurações</h3>'; }