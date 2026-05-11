// Configuração da API
const API_URL = "https://script.google.com/macros/s/AKfycbzY_J3ODgUI6VTpCgzoBcw-RzImTlxDjzOlgxY5HQ3F4EK8aNQl25K2FqW13LGG-Eb77Q/exec?aba=Query";
const API_CONFRONTO_URL = "https://script.google.com/macros/s/AKfycbzY_J3ODgUI6VTpCgzoBcw-RzImTlxDjzOlgxY5HQ3F4EK8aNQl25K2FqW13LGG-Eb77Q/exec?aba=Base Outbond Realizado";

// Variáveis globais
let allData = [];
let confrontoData = [];
let filteredData = [];
let departmentChart = null;
let scoreChart = null;
let currentSlide = 0;
let currentScreen = 'audit-dashboard';
const slidesTitles = [
    "Visão Geral (Gráfico)",
    "Score das Auditorias",
    "Últimas Auditorias"
];

// Variáveis para filtros da tabela de colaborador
// Agora departamento, funcao e status suportam múltiplos valores (Set)
let collaboratorFilters = {
    nome: '',
    departamento: new Set(),
    funcao: new Set(),
    status: new Set()
};

let collaboratorPeriodFilters = {
    startDate: null,
    endDate: null
};

// ============================================
// INICIALIZAÇÃO PÓS-ANIMAÇÃO
// ============================================

window.addEventListener('introFinished', () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.classList.remove('hidden');

    // Inicializa o relógio
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Inicializa a sidebar retrátil
    initializeSidebar();

    // Inicializa o menu com submenu
    initializeMenus();

    // Inicializa a alternância de telas
    initializeScreens();

    // Carrega os dados
    loadDashboardData();

    // Inicializa o carrossel
    initializeCarousel();
});

// Fallback caso a animação falhe ou o evento não dispare
document.addEventListener('DOMContentLoaded', () => {
    // Se após 5 segundos o conteúdo principal ainda estiver oculto, forçar exibição
    setTimeout(() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent && mainContent.classList.contains('hidden')) {
            console.log("Fallback: Forçando exibição do conteúdo principal");
            window.dispatchEvent(new CustomEvent('introFinished'));
        }
    }, 5000);
});

// ============================================
// SIDEBAR RETRÁTIL
// ============================================

function initializeSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

// ============================================
// MENU COM SUBMENU
// ============================================

function initializeMenus() {
    const menuParent = document.getElementById('audit-parent');
    const submenu = document.getElementById('audit-submenu');

    if (menuParent) {
        menuParent.addEventListener('click', (e) => {
            // Se o clique foi na seta (menu-arrow), apenas alterna o submenu
            if (e.target.classList.contains('menu-arrow')) {
                e.preventDefault();
                menuParent.classList.toggle('expanded');
                submenu.classList.toggle('active');
            }
            // Caso contrário, o comportamento padrão (navegar para o href) acontece
        });
    }
}

// ============================================
// ALTERNÂNCIA DE TELAS
// ============================================

function initializeScreens() {
    const menuItems = document.querySelectorAll('.menu-item[data-screen]');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const screenName = item.getAttribute('data-screen');
            switchScreen(screenName);
        });
    });
}

function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.querySelectorAll('.menu-item[data-screen]').forEach(item => item.classList.remove('active'));

    const screen = document.getElementById(`screen-${screenName}`);
    if (screen) {
        screen.classList.add('active');
        // Garante que a tela comece no topo
        screen.scrollTop = 0;
        const container = screen.querySelector('.container');
        if (container) container.scrollTop = 0;
    }

    const menuItem = document.querySelector(`.menu-item[data-screen="${screenName}"]`);
    if (menuItem) menuItem.classList.add('active');

    currentScreen = screenName;

    if (screenName === 'audit-collaborator') {
        initializeCollaboratorFilters();
        initializeExportButtons();
        initializeReportExport();
        updateCollaboratorTable();
        updateCollaboratorStats();
    }
}

// ============================================
// RELÓGIO E DATA
// ============================================

function updateDateTime() {
    const now = new Date();
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const dayName = days[now.getDay()];
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');

    document.getElementById('current-date').textContent = `${dayName}, ${day}/${month}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
        lastUpdated.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// ============================================
// CARROSSEL
// ============================================

function initializeCarousel() {
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const indicators = document.querySelectorAll('.indicator');

    if (prevBtn) prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(currentSlide - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(currentSlide + 1);
    });

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', (e) => {
            e.preventDefault();
            goToSlide(index);
        });
    });
}

function goToSlide(slideIndex) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    if (slides.length === 0) return;

    if (slideIndex >= slides.length) currentSlide = 0;
    else if (slideIndex < 0) currentSlide = slides.length - 1;
    else currentSlide = slideIndex;

    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');

    const titleElement = document.getElementById('carousel-title');
    if (titleElement) titleElement.textContent = slidesTitles[currentSlide];

    if (currentSlide === 0 && departmentChart) setTimeout(() => departmentChart.resize(), 100);
    else if (currentSlide === 1 && scoreChart) setTimeout(() => scoreChart.resize(), 100);
}

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 15000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {...options, signal: controller.signal });
    clearTimeout(id);
    return response;
}

async function loadDashboardData() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
        loadingSpinner.innerHTML = '<div class="spinner"></div><p id="loading-text">Conectando à API...</p>';
    }

    try {
        document.getElementById('loading-text').textContent = "Carregando Auditorias...";
        const resQuery = await fetchWithTimeout(API_URL);
        allData = await resQuery.json();

        document.getElementById('loading-text').textContent = "Carregando Base de Confronto...";
        const resConfronto = await fetchWithTimeout(API_CONFRONTO_URL);
        confrontoData = await resConfronto.json();

        filteredData = [...allData];
        updateStats();
        updateCharts();
        updateTable();
        populateFilters();

        if (loadingSpinner) loadingSpinner.style.display = 'none';
    } catch (e) {
        console.error("Erro no carregamento:", e);
        if (loadingSpinner) {
            loadingSpinner.innerHTML = `<p style="color: #ef4444;">Erro ao carregar dados. Verifique a conexão.</p><button onclick="loadDashboardData()" class="btn-apply" style="margin-top: 10px;">Tentar Novamente</button>`;
        }
    }
}

function updateStats() {
    document.getElementById('total-audits').textContent = filteredData.length;
    const totalScore = filteredData.reduce((acc, curr) => {
        const val = parseFloat(curr.Score.replace('%', '')) || 0;
        return acc + val;
    }, 0);
    const avg = filteredData.length > 0 ? (totalScore / filteredData.length).toFixed(1) : 0;
    document.getElementById('avg-score').textContent = avg + '%';

    const depts = new Set(filteredData.map(d => d.Departamento));
    document.getElementById('total-departments').textContent = depts.size;

    const conf = filteredData.reduce((acc, curr) => acc + (parseInt(curr.Conformidades) || 0), 0);
    document.getElementById('conformities').textContent = conf;
}

function updateCharts() {
    updateDepartmentChart();
    updateScoreChart();
}

function updateDepartmentChart() {
    const auditsByDate = {};

    // Agrupa dados por data normalizada (YYYY-MM-DD) para facilitar ordenação
    filteredData.forEach(item => {
        const d = parseAnyDate(item.Data);
        if (d) {
            const key = d.toISOString().split('T')[0];
            auditsByDate[key] = (auditsByDate[key] || 0) + 1;
        }
    });

    const canvas = document.getElementById('departmentChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (departmentChart) departmentChart.destroy();

    // Ordena as chaves (datas YYYY-MM-DD)
    const sortedKeys = Object.keys(auditsByDate).sort();

    // Cria labels formatadas para exibição (DD/MM)
    const displayLabels = sortedKeys.map(key => {
        const [y, m, d] = key.split('-');
        return `${d}/${m}`;
    });

    departmentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: displayLabels,
            datasets: [{
                label: 'Auditorias',
                data: sortedKeys.map(k => auditsByDate[k]),
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0 // Linha "pontuda" (reta entre os pontos)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: '#cbd5e1' } }
            },
            scales: {
                x: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function updateScoreChart() {
    const ranges = { '90-100%': 0, '70-89%': 0, '50-69%': 0, '< 50%': 0 };
    filteredData.forEach(item => {
        const score = parseFloat(item.Score.replace('%', '')) || 0;
        if (score >= 90) ranges['90-100%']++;
        else if (score >= 70) ranges['70-89%']++;
        else if (score >= 50) ranges['50-69%']++;
        else ranges['< 50%']++;
    });

    const canvas = document.getElementById('scoreChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (scoreChart) scoreChart.destroy();
    scoreChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ranges),
            datasets: [{
                data: Object.values(ranges),
                backgroundColor: ['#10b981', '#38bdf8', '#f59e0b', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: '#cbd5e1' } }
            }
        }
    });
}

function updateTable() {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    tbody.innerHTML = filteredData.slice(0, 15).map(audit => `
        <tr>
            <td>${audit.Departamento}</td>
            <td>${audit.Usuário}</td>
            <td>${audit.Formulário}</td>
            <td><span class="score-badge" style="background:${getScoreColor(audit.Score)}">${audit.Score}</span></td>
            <td>${audit.Conformidades}</td>
            <td>${audit['Não Conformidades']}</td>
        </tr>
    `).join('');
}

function populateFilters() {
    const deptFilter = document.getElementById('department-filter');
    const depts = [...new Set(allData.map(d => d.Departamento))].sort();
    deptFilter.innerHTML = '<option value="">Todos os Departamentos</option>' +
        depts.map(d => `<option value="${d}">${d}</option>`).join('');

    // Inicializa os listeners dos filtros do Dashboard Geral
    initializeDashboardFilters();
}

// ============================================
// FILTROS DO DASHBOARD GERAL
// ============================================

function initializeDashboardFilters() {
    const applyBtn = document.getElementById('apply-filters');
    const resetBtn = document.getElementById('reset-filters');
    const deptFilter = document.getElementById('department-filter');
    const dateStart = document.getElementById('date-start');
    const dateEnd = document.getElementById('date-end');

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            applyDashboardFilters();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetDashboardFilters();
        });
    }
}

function applyDashboardFilters() {
    const deptFilter = document.getElementById('department-filter').value;
    const dateStart = document.getElementById('date-start').value;
    const dateEnd = document.getElementById('date-end').value;

    filteredData = allData.filter(item => {
        // Filtro de departamento
        if (deptFilter && item.Departamento !== deptFilter) return false;

        // Filtro de datas
        if (dateStart || dateEnd) {
            const itemDate = parseAnyDate(item.Data);
            if (!itemDate) return true;

            if (dateStart) {
                const start = new Date(dateStart + 'T00:00:00');
                if (itemDate < start) return false;
            }

            if (dateEnd) {
                const end = new Date(dateEnd + 'T23:59:59');
                if (itemDate > end) return false;
            }
        }

        return true;
    });

    // Atualiza os gráficos, tabela e estatísticas
    updateStats();
    updateCharts();
    updateTable();
}

function parseAnyDate(dateString) {
    if (!dateString) return null;

    // Tenta parse direto (funciona para ISO 8601: "2026-04-18T03:00:00.000Z")
    let d = new Date(dateString);
    if (!isNaN(d.getTime())) return d;

    // Tenta formato brasileiro DD/MM/YYYY
    const parts = dateString.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        d = new Date(year, month - 1, day);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
}

function resetDashboardFilters() {
    document.getElementById('department-filter').value = '';
    document.getElementById('date-start').value = '';
    document.getElementById('date-end').value = '';

    filteredData = [...allData];
    updateStats();
    updateCharts();
    updateTable();
}

// Função parseDateBR removida e substituída por parseAnyDate para maior compatibilidade

// ============================================
// FILTROS AUDITORIA POR COLABORADOR (NOVA LÓGICA)
// ============================================

// ============================================
// MULTI-SELECT DROPDOWN (FILTROS DE COLUNA)
// ============================================

function initMultiSelect(column) {
    const wrapper = document.querySelector(`.multi-select-wrapper[data-column="${column}"]`);
    if (!wrapper) return;

    const btn = wrapper.querySelector('.multi-select-btn');
    const dropdown = wrapper.querySelector('.multi-select-dropdown');
    const searchInput = wrapper.querySelector('.multi-select-search');
    const clearBtn = wrapper.querySelector('.multi-select-clear');

    // Abrir / fechar dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        // Fecha todos os outros dropdowns
        document.querySelectorAll('.multi-select-dropdown.open').forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('open');
                const otherBtn = d.closest('.multi-select-wrapper').querySelector('.multi-select-btn');
                if (otherBtn) otherBtn.classList.remove('open');
            }
        });

        if (!isOpen) {
            dropdown.classList.add('open');
            btn.classList.add('open');
            if (searchInput) searchInput.focus();
        } else {
            dropdown.classList.remove('open');
            btn.classList.remove('open');
        }
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('open');
            btn.classList.remove('open');
        }
    });

    // Busca interna
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            wrapper.querySelectorAll('.multi-select-option').forEach(opt => {
                const text = opt.textContent.toLowerCase();
                opt.classList.toggle('hidden', !text.includes(q));
            });
        });
    }

    // Checkbox change
    const optionsContainer = wrapper.querySelector('.multi-select-options');
    optionsContainer.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const val = e.target.value;
            if (e.target.checked) {
                collaboratorFilters[column].add(val);
            } else {
                collaboratorFilters[column].delete(val);
            }
            updateMultiSelectLabel(column);
            updateCollaboratorTable();
            updateCollaboratorStats();
        }
    });

    // Limpar seleção
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            collaboratorFilters[column].clear();
            wrapper.querySelectorAll('.multi-select-option input[type="checkbox"]').forEach(cb => cb.checked = false);
            updateMultiSelectLabel(column);
            updateCollaboratorTable();
            updateCollaboratorStats();
        });
    }
}

function updateMultiSelectLabel(column) {
    const wrapper = document.querySelector(`.multi-select-wrapper[data-column="${column}"]`);
    if (!wrapper) return;
    const labelEl = wrapper.querySelector('.multi-select-label');
    const selected = collaboratorFilters[column];
    // Remove badge anterior se existir
    const oldBadge = wrapper.querySelector('.multi-select-count');
    if (oldBadge) oldBadge.remove();

    if (selected.size === 0) {
        labelEl.textContent = '(Tudo)';
    } else if (selected.size === 1) {
        labelEl.textContent = [...selected][0];
    } else {
        labelEl.textContent = `${selected.size} selecionados`;
    }

    if (selected.size > 0) {
        const badge = document.createElement('span');
        badge.className = 'multi-select-count';
        badge.textContent = selected.size;
        const btn = wrapper.querySelector('.multi-select-btn');
        btn.insertBefore(badge, btn.querySelector('.multi-select-arrow'));
    }
}

function populateMultiSelectOptions(column, values) {
    const wrapper = document.querySelector(`.multi-select-wrapper[data-column="${column}"]`);
    if (!wrapper) return;
    const optionsContainer = wrapper.querySelector('.multi-select-options');
    if (!optionsContainer) return;
    // Preserva opções existentes (como as do Status que já estão no HTML)
    if (optionsContainer.children.length > 0) return;
    optionsContainer.innerHTML = [...values].sort().map(v =>
        `<label class="multi-select-option">
            <input type="checkbox" value="${v}"> ${v}
        </label>`
    ).join('');
}

function initializeCollaboratorFilters() {
    // Filtro de Texto (Nome)
    const nameFilter = document.querySelector('.col-excel-filter-text[data-column="nome"]');
    if (nameFilter) {
        nameFilter.addEventListener('input', (e) => {
            collaboratorFilters.nome = e.target.value.toLowerCase();
            updateCollaboratorTable();
            updateCollaboratorStats();
        });
    }

    // Inicializa os multi-selects
    initMultiSelect('departamento');
    initMultiSelect('funcao');
    initMultiSelect('status');

    // Período
    const applyBtn = document.getElementById('apply-collab-period-filters');
    if (applyBtn) applyBtn.onclick = () => {
        const start = document.getElementById('collaborator-date-start').value;
        const end = document.getElementById('collaborator-date-end').value;
        collaboratorPeriodFilters.startDate = start ? new Date(start + 'T00:00:00') : null;
        collaboratorPeriodFilters.endDate = end ? new Date(end + 'T23:59:59') : null;
        updateCollaboratorTable();
        updateCollaboratorStats();
    };

    const resetBtn = document.getElementById('reset-collab-period-filters');
    if (resetBtn) resetBtn.onclick = () => {
        document.getElementById('collaborator-date-start').value = '';
        document.getElementById('collaborator-date-end').value = '';
        collaboratorPeriodFilters = { startDate: null, endDate: null };
        updateCollaboratorTable();
        updateCollaboratorStats();
    };

    populateCollaboratorOptions();
}

function populateCollaboratorOptions() {
    if (!confrontoData.length) return;
    const depts = new Set();
    const funcs = new Set();

    confrontoData.forEach(item => {
        depts.add(item.DEPARTAMENTO || item.Departamento || "N/A");
        funcs.add(item.FUNÇÃO || item.Função || "COLABORADOR");
    });

    populateMultiSelectOptions('departamento', depts);
    populateMultiSelectOptions('funcao', funcs);
}

function updateCollaboratorStats() {
    const processed = confrontoData.map(item => {
        const nome = item.NOME || item.Nome || "N/A";
        const dept = item.DEPARTAMENTO || item.Departamento || "N/A";
        const funcao = item.FUNÇÃO || item.Função || "COLABORADOR";

        let realizado = 0;
        let dias = 0;
        Object.keys(item).forEach(key => {
            const d = new Date(key);
            if (!isNaN(d.getTime())) {
                if ((!collaboratorPeriodFilters.startDate || d >= collaboratorPeriodFilters.startDate) &&
                    (!collaboratorPeriodFilters.endDate || d <= collaboratorPeriodFilters.endDate)) {
                    realizado += parseInt(item[key]) || 0;
                    dias++;
                }
            }
        });

        const meta = dias * 3;
        let status = 'Sem Auditorias';
        let color = '#ef4444';
        if (realizado > 0) {
            if (realizado >= meta) {
                status = 'Meta Atingida';
                color = '#10b981';
            } else {
                status = 'Meta Não Atingida';
                color = '#f59e0b';
            }
        }

        return { nome, dept, funcao, realizado, meta, status, color };
    });

    const filtered = processed.filter(item => {
        if (collaboratorFilters.nome && !item.nome.toLowerCase().includes(collaboratorFilters.nome)) return false;
        if (collaboratorFilters.departamento.size > 0 && !collaboratorFilters.departamento.has(item.dept)) return false;
        if (collaboratorFilters.funcao.size > 0 && !collaboratorFilters.funcao.has(item.funcao)) return false;
        if (collaboratorFilters.status.size > 0 && !collaboratorFilters.status.has(item.status)) return false;
        return true;
    });

    let metaAtigida = 0;
    let metaNaoAtigida = 0;
    let semAuditorias = 0;

    filtered.forEach(item => {
        if (item.status === 'Meta Atingida') {
            metaAtigida++;
        } else if (item.status === 'Meta Não Atingida') {
            metaNaoAtigida++;
        } else if (item.status === 'Sem Auditorias') {
            semAuditorias++;
        }
    });

    document.getElementById('collab-meta-atingida').textContent = metaAtigida;
    document.getElementById('collab-meta-nao-atingida').textContent = metaNaoAtigida;
    document.getElementById('collab-sem-auditorias').textContent = semAuditorias;
}

function updateCollaboratorTable() {
    const tableBody = document.getElementById('collaborator-table-body');
    if (!tableBody || !confrontoData.length) return;

    const processed = confrontoData.map(item => {
        const nome = item.NOME || item.Nome || "N/A";
        const dept = item.DEPARTAMENTO || item.Departamento || "N/A";
        const funcao = item.FUNÇÃO || item.Função || "COLABORADOR";

        let realizado = 0;
        let dias = 0;
        Object.keys(item).forEach(key => {
            const d = new Date(key);
            if (!isNaN(d.getTime())) {
                if ((!collaboratorPeriodFilters.startDate || d >= collaboratorPeriodFilters.startDate) &&
                    (!collaboratorPeriodFilters.endDate || d <= collaboratorPeriodFilters.endDate)) {
                    realizado += parseInt(item[key]) || 0;
                    dias++;
                }
            }
        });

        const meta = dias * 3;
        let status = 'Sem Auditorias';
        let color = '#ef4444';
        if (realizado > 0) {
            if (realizado >= meta) {
                status = 'Meta Atingida';
                color = '#10b981';
            } else {
                status = 'Meta Não Atingida';
                color = '#f59e0b';
            }
        }

        return { nome, dept, funcao, realizado, meta, status, color };
    });

    const filtered = processed.filter(item => {
        if (collaboratorFilters.nome && !item.nome.toLowerCase().includes(collaboratorFilters.nome)) return false;
        if (collaboratorFilters.departamento.size > 0 && !collaboratorFilters.departamento.has(item.dept)) return false;
        if (collaboratorFilters.funcao.size > 0 && !collaboratorFilters.funcao.has(item.funcao)) return false;
        if (collaboratorFilters.status.size > 0 && !collaboratorFilters.status.has(item.status)) return false;
        return true;
    });

    tableBody.innerHTML = filtered.map(item => `
        <tr>
            <td>${item.nome}</td>
            <td>${item.dept}</td>
            <td>${item.funcao}</td>
            <td style="text-align:center; font-size: 0.8rem;">${collaboratorPeriodFilters.startDate ? collaboratorPeriodFilters.startDate.toLocaleDateString('pt-BR') : '--'} - ${collaboratorPeriodFilters.endDate ? collaboratorPeriodFilters.endDate.toLocaleDateString('pt-BR') : '--'}</td>
            <td style="text-align:center; font-weight:700; color:#38bdf8">${item.realizado}</td>
            <td style="text-align:center; font-weight:700">${item.meta}</td>
            <td style="padding: 1rem 1.5rem;">
                <span class="status-badge" style="background:rgba(${item.color === '#10b981' ? '16,185,129' : item.color === '#f59e0b' ? '245,158,11' : '239,68,68'}, 0.2); color:${item.color}; border:1px solid ${item.color}">
                    ${item.status}
                </span>
            </td>
        </tr>
    `).join('');
}

function getScoreColor(score) {
    const val = parseFloat(score.replace('%', '')) || 0;
    if (val >= 90) return '#10b981';
    if (val >= 70) return '#38bdf8';
    if (val >= 50) return '#f59e0b';
    return '#ef4444';
}

// ============================================
// EXPORTACAO DE DADOS (EXCEL E CSV)
// ============================================

function initializeExportButtons() {
    const excelBtn = document.getElementById('export-excel-btn');
    const csvBtn = document.getElementById('export-csv-btn');

    if (excelBtn) {
        excelBtn.addEventListener('click', exportTableToExcel);
    }
    if (csvBtn) {
        csvBtn.addEventListener('click', exportTableToCSV);
    }
}

function getTableDataForExport() {
    const tableBody = document.getElementById('collaborator-table-body');
    if (!tableBody) return [];

    const data = [];
    const rows = tableBody.querySelectorAll('tr');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [];
        cells.forEach(cell => {
            rowData.push(cell.textContent.trim());
        });
        if (rowData.length > 0) {
            data.push(rowData);
        }
    });

    return data;
}

function getTableHeaders() {
    return ['Colaborador', 'Departamento', 'Funcao', 'Periodo', 'Realizado', 'Meta', 'Status'];
}

function exportTableToExcel() {
    try {
        const headers = getTableHeaders();
        const data = getTableDataForExport();

        if (data.length === 0) {
            alert('Nenhum dado para exportar. Verifique os filtros aplicados.');
            return;
        }

        // Cria array com headers + dados
        const exportData = [headers, ...data];

        // Cria worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(exportData);

        // Define largura das colunas
        const colWidths = [
            { wch: 20 }, // Colaborador
            { wch: 18 }, // Departamento
            { wch: 18 }, // Funcao
            { wch: 25 }, // Periodo
            { wch: 12 }, // Realizado
            { wch: 12 }, // Meta
            { wch: 18 } // Status
        ];
        worksheet['!cols'] = colWidths;

        // Estiliza header
        const headerStyle = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1F2937' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: '38BDF8' } },
                bottom: { style: 'thin', color: { rgb: '38BDF8' } },
                left: { style: 'thin', color: { rgb: '38BDF8' } },
                right: { style: 'thin', color: { rgb: '38BDF8' } }
            }
        };

        for (let i = 0; i < headers.length; i++) {
            const cellRef = XLSX.utils.encode_col(i) + '1';
            if (!worksheet[cellRef]) worksheet[cellRef] = {};
            worksheet[cellRef].s = headerStyle;
        }

        // Estiliza dados
        const dataStyle = {
            alignment: { horizontal: 'left', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: 'E5E7EB' } },
                bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
                left: { style: 'thin', color: { rgb: 'E5E7EB' } },
                right: { style: 'thin', color: { rgb: 'E5E7EB' } }
            }
        };

        for (let row = 2; row <= data.length + 1; row++) {
            for (let col = 0; col < headers.length; col++) {
                const cellRef = XLSX.utils.encode_col(col) + row;
                if (!worksheet[cellRef]) worksheet[cellRef] = {};
                worksheet[cellRef].s = dataStyle;
            }
        }

        // Cria workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditorias');

        // Gera nome do arquivo com data/hora
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `Auditorias_Colaboradores_${timestamp}.xlsx`;

        // Faz download
        XLSX.writeFile(workbook, filename);
    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        alert('Erro ao exportar para Excel. Tente novamente.');
    }
}

function exportTableToCSV() {
    try {
        const headers = getTableHeaders();
        const data = getTableDataForExport();

        if (data.length === 0) {
            alert('Nenhum dado para exportar. Verifique os filtros aplicados.');
            return;
        }

        // Funcao para escapar valores CSV
        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return '"' + stringValue.replace(/"/g, '""') + '"';
            }
            return stringValue;
        };

        // Cria CSV
        let csv = headers.map(escapeCSV).join(',') + '\n';
        data.forEach(row => {
            csv += row.map(escapeCSV).join(',') + '\n';
        });

        // Cria blob
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        // Gera nome do arquivo com data/hora
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `Auditorias_Colaboradores_${timestamp}.csv`;

        // Faz download
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        alert('Erro ao exportar para CSV. Tente novamente.');
    }
}

// ============================================
// EXPORTACAO DE RELATORIO VISUAL
// ============================================

function initializeReportExport() {
    const reportBtn = document.getElementById('export-report-btn');
    if (reportBtn) {
        // Redirecionado para o novo motor de exportação no report-engine.js
        reportBtn.addEventListener('click', () => {
            if (!confrontoData.length) {
                alert('Nenhum dado disponível para exportar.');
                return;
            }
            // Salvar dados globalmente para o motor
            window.reportData = calculateReportData();
            // Chamar exportação do report-engine.js
            if (window.exportReportAsImage) {
                window.exportReportAsImage();
            } else {
                alert('Motor de exportação não carregado.');
            }
        });
    }
}

function calculateReportData() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // WTD: Domingo da semana atual até Ontem
    const weekStart = new Date(yesterday);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // Dados Filtrados (respeitando filtros da tabela)
    const filteredBase = getFilteredCollaborators();

    // Estatísticas D-1 e WTD
    const d1Stats = calculateStatsForPeriod(filteredBase, yesterday, yesterday);
    const wtdStats = calculateStatsForPeriod(filteredBase, weekStart, yesterday);

    // Dados por Função (WTD)
    const functionStats = calculateStatsByFunction(filteredBase, weekStart, yesterday);

    // Evolução Diária (WTD)
    const dailyStats = calculateDailyStats(filteredBase, weekStart, yesterday);

    return {
        d1: d1Stats,
        wtd: wtdStats,
        yesterday: yesterday,
        weekStart: weekStart,
        functionStats: functionStats,
        dailyStats: dailyStats
    };
}

function getFilteredCollaborators() {
    const processed = confrontoData.map(item => {
        const nome = item.NOME || item.Nome || "N/A";
        const dept = item.DEPARTAMENTO || item.Departamento || "N/A";
        const funcao = item.FUNÇÃO || item.Função || "COLABORADOR";
        return {...item, nome, dept, funcao };
    });

    return processed.filter(item => {
        if (collaboratorFilters.nome && !item.nome.toLowerCase().includes(collaboratorFilters.nome)) return false;
        if (collaboratorFilters.departamento.size > 0 && !collaboratorFilters.departamento.has(item.dept)) return false;
        if (collaboratorFilters.funcao.size > 0 && !collaboratorFilters.funcao.has(item.funcao)) return false;
        if (collaboratorFilters.status.size > 0) {
            // Para filtrar por status, precisamos calcular o status no período atual do filtro da página
            const stats = calculateStatsForPeriod([item], collaboratorPeriodFilters.startDate || new Date(0), collaboratorPeriodFilters.endDate || new Date());
            if (!collaboratorFilters.status.has(stats.status)) return false;
        }
        return true;
    });
}

function calculateStatsForPeriod(data, start, end) {
    let metaAtigida = 0;
    let metaNaoAtigida = 0;
    let semAuditorias = 0;

    // Normalizar datas para comparação apenas de dia/mês/ano
    const sDate = new Date(start);
    sDate.setHours(0, 0, 0, 0);
    const eDate = new Date(end);
    eDate.setHours(23, 59, 59, 999);

    data.forEach(item => {
        let realizado = 0;
        let dias = 0;
        Object.keys(item).forEach(key => {
            // Tenta converter a chave (data da coluna)
            const d = new Date(key);
            if (!isNaN(d.getTime())) {
                d.setHours(12, 0, 0, 0); // Evitar problemas de fuso
                if (d >= sDate && d <= eDate) {
                    realizado += parseInt(item[key]) || 0;
                    dias++;
                }
            }
        });

        const meta = dias * 3;
        if (dias > 0) {
            if (realizado >= meta) metaAtigida++; // Corrigido: >= meta é sucesso
            else if (realizado > 0) metaNaoAtigida++;
            else semAuditorias++;
        }
    });

    const total = metaAtigida + metaNaoAtigida + semAuditorias;
    // Para fins de status individual (usado no filtro)
    let status = 'Sem Auditorias';
    if (total > 0) {
        if (metaAtigida > 0) status = 'Meta Atingida';
        else if (metaNaoAtigida > 0) status = 'Meta Não Atingida';
    }

    return {
        total,
        metaAtigida,
        metaNaoAtigida,
        semAuditorias,
        status,
        adhesionPct: total > 0 ? ((metaAtigida / total) * 100).toFixed(1) : 0,
        abovePct: total > 0 ? ((metaAtigida / total) * 100).toFixed(1) : 0,
        belowPct: total > 0 ? ((metaNaoAtigida / total) * 100).toFixed(1) : 0,
        nonePct: total > 0 ? ((semAuditorias / total) * 100).toFixed(1) : 0
    };
}

function calculateStatsByFunction(data, start, end) {
    const stats = {};
    data.forEach(item => {
        const f = item.funcao;
        if (!stats[f]) stats[f] = { total: 0, atingiu: 0, naoAtingiu: 0, naoResp: 0 };

        let realizado = 0;
        let dias = 0;
        Object.keys(item).forEach(key => {
            const d = new Date(key);
            if (!isNaN(d.getTime()) && d >= start && d <= end) {
                realizado += parseInt(item[key]) || 0;
                dias++;
            }
        });

        if (dias > 0) {
            stats[f].total++;
            const meta = dias * 3;
            if (realizado >= meta) stats[f].atingiu++;
            else if (realizado > 0) stats[f].naoAtingiu++;
            else stats[f].naoResp++;
        }
    });
    return stats;
}

function calculateDailyStats(data, start, end) {
    const daily = {};
    let current = new Date(start);
    current.setHours(12, 0, 0, 0);
    const endLimit = new Date(end);
    endLimit.setHours(12, 0, 0, 0);

    // Criar um mapa de chaves originais para facilitar a busca
    // As chaves no confrontoData podem ser ISO strings ou outros formatos que o new Date() entende
    const allKeys = data.length > 0 ? Object.keys(data[0]) : [];
    const dateKeyMap = {};
    allKeys.forEach(key => {
        const d = new Date(key);
        if (!isNaN(d.getTime())) {
            const iso = d.toISOString().split('T')[0];
            dateKeyMap[iso] = key;
        }
    });

    while (current <= endLimit) {
        const isoKey = current.toISOString().split('T')[0];
        const originalKey = dateKeyMap[isoKey];

        daily[isoKey] = { atingiu: 0, naoAtingiu: 0, naoResp: 0 };

        if (originalKey) {
            data.forEach(item => {
                const val = parseInt(item[originalKey]) || 0;
                if (val >= 3) daily[isoKey].atingiu++;
                else if (val > 0) daily[isoKey].naoAtingiu++;
                else daily[isoKey].naoResp++;
            });
        }

        current.setDate(current.getDate() + 1);
    }
    return daily;
}

function fillReportTemplate(data) {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // D-1
    const d1Date = data.yesterday;
    document.getElementById('report-d1-date').textContent = d1Date.toLocaleDateString('pt-BR');
    document.getElementById('report-d1-day').textContent = days[d1Date.getDay()];

    ['total', 'above', 'below', 'none', 'adhesion'].forEach(key => {
        const el = document.getElementById(`report-d1-${key}`);
        const val = key === 'total' ? data.d1.total :
            key === 'above' ? data.d1.metaAtigida :
            key === 'below' ? data.d1.metaNaoAtigida :
            key === 'none' ? data.d1.semAuditorias : data.d1.adhesionPct;
        if (el) el.textContent = val;

        const pctEl = document.getElementById(`report-d1-${key}-pct`);
        if (pctEl) {
            pctEl.textContent = key === 'above' ? data.d1.abovePct :
                key === 'below' ? data.d1.belowPct : data.d1.nonePct;
        }
    });

    // WTD
    document.getElementById('report-wtd-date').textContent = `${data.weekStart.toLocaleDateString('pt-BR')} a ${data.yesterday.toLocaleDateString('pt-BR')}`;
    const diffDays = Math.ceil((data.yesterday - data.weekStart) / (1000 * 60 * 60 * 24)) + 1;
    document.getElementById('report-wtd-days').textContent = `${diffDays} dias`;

    ['total', 'above', 'below', 'none', 'adhesion'].forEach(key => {
        const el = document.getElementById(`report-wtd-${key}`);
        const val = key === 'total' ? data.wtd.total :
            key === 'above' ? data.wtd.metaAtigida :
            key === 'below' ? data.wtd.metaNaoAtigida :
            key === 'none' ? data.wtd.semAuditorias : data.wtd.adhesionPct;
        if (el) el.textContent = val;

        const pctEl = document.getElementById(`report-wtd-${key}-pct`);
        if (pctEl) {
            pctEl.textContent = key === 'above' ? data.wtd.abovePct :
                key === 'below' ? data.wtd.belowPct : data.wtd.nonePct;
        }
    });

    // Tabela por Função
    const tbody = document.getElementById('report-function-table-body');
    tbody.innerHTML = Object.entries(data.functionStats).map(([func, s]) => {
        const adhesion = s.total > 0 ? ((s.atingiu / s.total) * 100).toFixed(1) : 0;
        return `
            <tr>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: bold;">${func}</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${s.total}</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${s.atingiu}</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${s.naoAtingiu}</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center;">${s.naoResp}</td>
                <td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; background: #f8fafc;">${adhesion}%</td>
            </tr>
        `;
    }).join('');

    // Injetar Gráficos SVG Simples
    renderBarChart(data.functionStats);
    renderLineChart(data.dailyStats);

    // Rodapé
    document.getElementById('report-generated-date').textContent = new Date().toLocaleString('pt-BR');
    const activeFilters = [];
    if (collaboratorFilters.nome) activeFilters.push(`Nome: ${collaboratorFilters.nome}`);
    if (collaboratorFilters.departamento.size) activeFilters.push(`Depts: ${Array.from(collaboratorFilters.departamento).join(', ')}`);
    document.getElementById('report-source-filters').textContent = activeFilters.length ? activeFilters.join(' | ') : 'Sem filtros ativos';
}

function renderBarChart(stats) {
    const container = document.getElementById('report-bar-chart-container');
    const entries = Object.entries(stats);
    if (!entries.length) return;

    const maxTotal = Math.max(...entries.map(e => e[1].total));

    let html = `<div style="display: flex; flex-direction: column; gap: 10px; padding-top: 10px;">`;
    entries.forEach(([name, s]) => {
        const pAtingiu = (s.atingiu / s.total) * 100;
        const pNaoAtingiu = (s.naoAtingiu / s.total) * 100;
        const pNaoResp = (s.naoResp / s.total) * 100;
        const width = (s.total / maxTotal) * 100;

        html += `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 80px; font-size: 9px; font-weight: bold; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
                <div style="flex: 1; height: 18px; display: flex; border-radius: 2px; overflow: hidden; background: #f1f5f9; width: ${width}%;">
                    <div style="width: ${pAtingiu}%; background: #10b981;" title="Atingiu"></div>
                    <div style="width: ${pNaoAtingiu}%; background: #f59e0b;" title="Não Atingiu"></div>
                    <div style="width: ${pNaoResp}%; background: #ef4444;" title="Não Respondeu"></div>
                </div>
                <div style="width: 30px; font-size: 9px; font-weight: bold;">${s.total}</div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function renderLineChart(daily) {
    const container = document.getElementById('report-line-chart-container');
    const entries = Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0]));
    if (!entries.length) return;

    const maxVal = Math.max(...entries.map(e => Math.max(e[1].atingiu, e[1].naoAtingiu, e[1].naoResp, 10)));
    const width = 900;
    const height = 150;
    const step = width / (entries.length - 1 || 1);

    const getPoints = (key) => entries.map((e, i) => `${i * step},${height - (e[1][key] / maxVal * height)}`).join(' ');

    container.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height + 30}" preserveAspectRatio="none">
            <polyline fill="none" stroke="#10b981" stroke-width="3" points="${getPoints('atingiu')}" />
            <polyline fill="none" stroke="#f59e0b" stroke-width="3" points="${getPoints('naoAtingiu')}" />
            <polyline fill="none" stroke="#ef4444" stroke-width="3" points="${getPoints('naoResp')}" />
            ${entries.map((e, i) => `
                <text x="${i * step}" y="${height + 20}" font-size="10" text-anchor="middle" fill="#64748b">
                    ${e[0].split('-')[2]}/${e[0].split('-')[1]}
                </text>
            `).join('')}
        </svg>
    `;
}

(function() {
    const text = "OUTBOUND";
    const container = document.getElementById('logoText');
    if (!container) return;

    // Criar as letras dinamicamente
    text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.classList.add('letter-intro');
        
        // Delay curto entre letras para fluidez (0.05s)
        span.style.animationDelay = `${i * 0.07}s`;
        
        // 'OUT' com destaque suave
        if(i < 3) span.classList.add('highlight');
        
        container.appendChild(span);
    });

    // Remover preloader após a animação
    window.addEventListener('load', () => {
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('hide-loader');
                document.body.style.overflow = 'auto';
                
                // Disparar evento para outros scripts saberem que a animação acabou
                window.dispatchEvent(new CustomEvent('introFinished'));
            }
        }, 3000); // Exibe por 3 segundos
    });
})();