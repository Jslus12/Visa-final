'use strict';

/* ══════════════════════════════════════════════
   VIGILÂNCIANET — Application Logic (Analista)
══════════════════════════════════════════════ */

const processes = [
  { id: '#2026-00123', empresa: 'Restaurante Sabor Ltda',   cnpj: '12.345.678/0001-90', status: 'Aprovado',     ia: 'Válida',   data: '08/04/2026', analista: 'Dra. Carla M.', tipo: 'Alvará Sanitário', docs: { alvara:'ok',  tecnico:'ok',   licenca:'ok'  }, obs: '' },
  { id: '#2026-00124', empresa: 'Mercado Bom Preço',       cnpj: '98.765.432/0001-19', status: 'Em análise',   ia: 'Válida',   data: '09/04/2026', analista: 'Dr. Bruno R.',  tipo: 'Renovação',       docs: { alvara:'ok',  tecnico:'warn', licenca:'ok'  }, obs: 'Documento técnico com campo responsável incompleto.' },
  { id: '#2026-00125', empresa: 'Padaria Doce Pão',        cnpj: '11.222.333/0001-81', status: 'Com erro',     ia: 'Válida',   data: '10/04/2026', analista: 'Dra. Carla M.', tipo: 'Novo',            docs: { alvara:'err', tecnico:'ok',   licenca:'ok'  }, obs: 'Alvará anterior com data de validade expirada.' },
  { id: '#2026-00126', empresa: 'Clínica Saúde+',          cnpj: '44.555.888/0001-28', status: 'Ag. correção', ia: 'Inválida', data: '11/04/2026', analista: 'Dr. Bruno R.',  tipo: 'Renovação',       docs: { alvara:'ok',  tecnico:'err',  licenca:'ok'  }, obs: 'Responsável técnico não está cadastrado no CRM.' },
  { id: '#2026-00127', empresa: 'Farmácia Vida',           cnpj: '77.888.999/0001-38', status: 'Aprovado',     ia: 'Válida',   data: '12/04/2026', analista: 'Dra. Carla M.', tipo: 'Alvará Sanitário', docs: { alvara:'ok',  tecnico:'ok',   licenca:'ok'  }, obs: '' },
];

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
    { icon: iconChart(),     label: 'Relatórios',       page: 'analyst-reports' },
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
  `;
}

function uploadZone(type, emoji, label, hint) {
  return `<div class="upload-zone" id="zone-${type}">
    <input type="file" accept=".pdf" onchange="handleFileInput(event,'${type}')">
    <div class="upload-info">
      <div class="upload-icon doc">${emoji}</div>
      <div><div class="upload-name">${label}</div><div class="upload-hint">${hint}</div></div>
    </div>
    <button class="btn btn-ghost btn-sm" type="button">${iconUpload()} Selecionar</button>
  </div>`;
}

function handleFileInput(e, type) {
  const file = e.target.files[0];
  if (!file) return;
  const zone = document.getElementById('zone-' + type);
  zone.classList.add('has-file');
}

function maskCNPJ(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/^(\d{2})(\d)/, '$1.$2');
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
  v = v.replace(/(\d{4})(\d)/, '$1-$2');
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
    <div class="card">
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Protocolo</th><th>Empresa</th><th>CNPJ</th><th>Tipo</th><th>Data</th><th>Status</th><th>IA</th><th>Ação</th></tr></thead>
            <tbody id="ptbody">
              ${processes.map((p, i) => `<tr>
                <td><code class="proto">${p.id}</code></td>
                <td style="font-weight:500">${p.empresa}</td>
                <td style="color:var(--gray-400);font-size:12px">${p.cnpj}</td>
                <td>${p.tipo}</td>
                <td>${p.data}</td>
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
   VISTORIAS
══════════════════════════════════════════════ */

function renderAnalystVistorias() {
  const vistorias = [
    { data:'15/04/2026', hora:'09:00', empresa:'Restaurante Sabor Ltda', end:'Rua das Flores, 123 — Centro' },
    { data:'17/04/2026', hora:'14:00', empresa:'Farmácia Vida',          end:'Av. Brasil, 456 — Zona Norte' }
  ];
  document.getElementById('content').innerHTML = `
    <div class="page-header"><div class="page-title">Vistorias Agendadas</div></div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${vistorias.map(v => `<div class="card" style="padding:16px"><strong>${v.empresa}</strong> - ${v.end} (${v.hora})</div>`).join('')}
    </div>
  `;
}

/* ══════════════════════════════════════════════
   RELATÓRIOS
══════════════════════════════════════════════ */

function renderAnalystReports() {
  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="page-title">Relatórios</div>
      <div class="page-sub">Análise consolidada dos processos sanitários.</div>
    </div>
    <div class="grid-2" style="margin-bottom:16px">
      <div class="card">
        <div class="card-header"><div class="card-title">Por status</div><div class="card-sub">Distribuição atual</div></div>
        <div class="card-body">
          <canvas id="chart-status"></canvas>
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════
   FUNÇÕES AUXILIARES / BADGES / ÍCONES
══════════════════════════════════════════════ */

function statusBadge(status) { return `<span class="badge">${status}</span>`; }
function iaBadge(ia) { return `<span class="badge ia">${ia}</span>`; }
function openAnalystModal(i) { alert("Abrindo processo de índice: " + i); }
function showToast(msg) { alert(msg); }

function iconHome() { return '🏠'; }
function iconSend() { return '🚀'; }
function iconList() { return '📋'; }
function iconCalendar() { return '📅'; }
function iconChart() { return '📊'; }
function iconGear() { return '⚙️'; }
function iconUser() { return '👤'; }
function iconUpload() { return '📤'; }