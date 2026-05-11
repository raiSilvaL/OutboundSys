// APIs para cada setor
const RANKING_APIS = {
    "Pit": "https://script.google.com/macros/s/AKfycbyHb2aTIK2b5-dpLkE0L0am1aCA-B_uIvkEjbz-cHs6DtMnwLBwCi7ZhkIRhLJK4njIzg/exec?aba=Pit",
    "Rebin": "https://script.google.com/macros/s/AKfycbyHb2aTIK2b5-dpLkE0L0am1aCA-B_uIvkEjbz-cHs6DtMnwLBwCi7ZhkIRhLJK4njIzg/exec?aba=Rebin",
    "Packing": "https://script.google.com/macros/s/AKfycbyHb2aTIK2b5-dpLkE0L0am1aCA-B_uIvkEjbz-cHs6DtMnwLBwCi7ZhkIRhLJK4njIzg/exec?aba=Packing",
    "ShipDock": "https://script.google.com/macros/s/AKfycbyHb2aTIK2b5-dpLkE0L0am1aCA-B_uIvkEjbz-cHs6DtMnwLBwCi7ZhkIRhLJK4njIzg/exec?aba=ShipDock"
};

let rankingData = {};
let rankingModal = null;

document.addEventListener('DOMContentLoaded', () => {
    rankingModal = document.getElementById('ranking-modal');

    // Carregar dados de ranking ao iniciar
    loadAllRankingData();

    // Fechar modal
    document.getElementById('ranking-close').addEventListener('click', closeRankingModal);
    rankingModal.addEventListener('click', (e) => {
        if (e.target === rankingModal) closeRankingModal();
    });
});

async function loadAllRankingData() {
    try {
        for (const [setor, url] of Object.entries(RANKING_APIS)) {
            const response = await fetch(url);
            const data = await response.json();
            // Filtrar linhas vazias ou com erro
            rankingData[setor] = data.filter(row => row["Employee Name"] || row["Employee\u00a0Name"] || row["#REF!"]);
        }
        console.log("Dados de ranking carregados:", Object.keys(rankingData));
    } catch (error) {
        console.error("Erro ao carregar dados de ranking:", error);
    }
}

function parseVal(val) {
    if (typeof val === 'string' && (val.includes('#DIV/0!') || val.trim() === '')) return 0;
    return parseFloat(val) || 0;
}

function getHourFromISO(isoString) {
    if (!isoString) return -1;
    try {
        const date = new Date(isoString);
        return date.getHours();
    } catch (e) {
        return -1;
    }
}

function isToday(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();

    // Para fins de teste com os dados da planilha (que são de 2026-04-16), 
    // se não houver dados de hoje real, vamos considerar a data mais recente da planilha
    // Mas a lógica correta para produção é comparar com hoje:
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

// Função para obter a data mais recente presente nos dados (para lidar com planilhas que não atualizam em tempo real no teste)
function getLatestDate(data) {
    if (!data || data.length === 0) return null;
    let latest = new Date(0);
    data.forEach(row => {
        const d = new Date(row.Data);
        if (d > latest) latest = d;
    });
    return latest;
}

function openRankingModal(horaISO, setor, turno) {
    if (!rankingData[setor]) {
        console.warn(`Dados não carregados para ${setor}`);
        return;
    }

    const targetHour = getHourFromISO(horaISO);

    // Determinar a data de filtro (Hoje ou a mais recente da planilha)
    const latestDate = getLatestDate(rankingData[setor]);
    const latestDateStr = latestDate ? latestDate.toISOString().split('T')[0] : null;

    console.log(`Filtrando ranking para Setor: ${setor}, Hora: ${targetHour}, Turno: ${turno}, Data: ${latestDateStr}`);

    // Filtrar dados
    let filteredData = rankingData[setor].filter(row => {
        // 1. Filtro de Data (Apenas o dia mais recente/hoje)
        const rowDate = new Date(row.Data).toISOString().split('T')[0];
        if (latestDateStr && rowDate !== latestDateStr) return false;

        // 2. Filtro de Turno/Hora
        if (turno === "Total") return true;

        const rowHour = getHourFromISO(row.Hora);
        const rowTurno = row.Turno || row[""];

        const hourMatch = targetHour !== -1 ? rowHour === targetHour : false;
        const turnoMatch = rowTurno && rowTurno.includes(turno.substring(0, 1));

        // Corrigido: usar AND (&&) em vez de OR (||) para garantir que AMBAS as condições sejam verdadeiras
        return hourMatch && turnoMatch;
    });

    // Ordenar por UPH (descending)
    filteredData.sort((a, b) => {
        const uphA = parseVal(a.UPH);
        const uphB = parseVal(b.UPH);
        return uphB - uphA;
    });

    // Atualizar informações do modal
    const horaDisplay = targetHour !== -1 ? targetHour.toString().padStart(2, '0') + ":00" : "Total";
    document.getElementById('ranking-hora').textContent = horaDisplay;
    document.getElementById('ranking-turno').textContent = turno;
    document.getElementById('ranking-setor').textContent = setor;
    document.getElementById('ranking-title').textContent = `Ranking de Produtividade - ${setor}`;

    // Renderizar tabela
    renderRankingTable(filteredData, setor);

    // Exibir modal
    rankingModal.classList.add('active');
}

function renderRankingTable(data, setor) {
    const table = document.getElementById('ranking-table-content');

    if (data.length === 0) {
        table.innerHTML = `
            <thead>
                <tr><th>Aviso</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td class="ranking-empty">
                        Nenhum dado encontrado para o dia atual neste setor.
                    </td>
                </tr>
            </tbody>
        `;
        return;
    }

    let html = `
        <thead>
            <tr>
                <th style="width: 60px;">Posição</th>
                <th>Funcionário</th>
                <th>Gerente</th>
                <th style="width: 100px; text-align: center;">Unidades</th>
                <th style="width: 100px; text-align: center;">UPH</th>
            </tr>
        </thead>
        <tbody>
    `;

    // Remover duplicatas de funcionários (pegar o melhor UPH do dia se houver múltiplas entradas)
    const uniqueEmployees = {};
    data.forEach(row => {
        const id = row["Employee Id"] || row["Employee Id"] || row["Employee Name"] || row["Employee\u00a0Name"] || row["#REF!"];
        if (!uniqueEmployees[id] || parseVal(row.UPH) > parseVal(uniqueEmployees[id].UPH)) {
            uniqueEmployees[id] = row;
        }
    });

    const sortedData = Object.values(uniqueEmployees).sort((a, b) => parseVal(b.UPH) - parseVal(a.UPH));
    const displayData = sortedData.slice(0, 50);

    displayData.forEach((row, index) => {
        const position = index + 1;
        let positionClass = 'ranking-position-other';
        let positionSymbol = position + 'º';

        if (position === 1) {
            positionClass = 'ranking-position-1';
            positionSymbol = '🥇 1º';
        } else if (position === 2) {
            positionClass = 'ranking-position-2';
            positionSymbol = '🥈 2º';
        } else if (position === 3) {
            positionClass = 'ranking-position-3';
            positionSymbol = '🥉 3º';
        }

        const employeeName = row["Employee Name"] || row["Employee\u00a0Name"] || row["Employee Id"] || row["#REF!"] || "N/A";
        const managerName = row["Manager Name"] || row["Manager\u00a0Name"] || "N/A";
        const units = Math.round(parseVal(row.Units || row.Quantity));
        const uph = parseVal(row.UPH).toFixed(2);

        html += `
            <tr>
                <td class="ranking-position ${positionClass}">${positionSymbol}</td>
                <td class="ranking-employee-name">${employeeName}</td>
                <td>${managerName}</td>
                <td style="text-align: center;">${units}</td>
                <td style="text-align: center;"><span class="ranking-uph">${uph}</span></td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;
}

function closeRankingModal() {
    rankingModal.classList.remove('active');
}

window.openRankingModal = openRankingModal;