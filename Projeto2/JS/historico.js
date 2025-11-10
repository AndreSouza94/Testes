document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for logged-in user (Requirement: Show only logged user's data)
    const userId = localStorage.getItem('idUsuario');
    if (!userId) {
        // Se não houver ID de usuário, redireciona para o login
        alert("Você precisa estar logado para ver o histórico. Redirecionando...");
        window.location.href = 'login.html';
        return;
    }
    
    // Carrega e renderiza o histórico
    loadHistory();

    // 2. Event listener for Remove Button (Requirement: Remove Selected)
    document.getElementById('removeSelected').addEventListener('click', removeSelectedSimulations);

    // 3. Event listener for Select All Checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', toggleSelectAll);
    }
    
    // 4. Adiciona listener para a tabela para lidar com checkboxes individuais
    document.getElementById('investmentTable').addEventListener('change', (e) => {
        if (e.target.classList.contains('row-select')) {
            updateSelectAllState();
        }
    });
});

// Helper functions for formatting (ADICIONADAS)

// Ajustada para garantir que valores monetários sejam formatados corretamente.
const formatCurrency = (value) => {
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return 'R$ 0,00';
    
    // Exibe o valor formatado com 2 casas decimais
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPercent = (value) => {
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return '0,00%';
    return numberValue.toFixed(2).replace('.', ',') + '%';
};

// Helper functions for localStorage
const getHistory = () => {
    const history = localStorage.getItem('simulacoesHistorico');
    return history ? JSON.parse(history) : [];
};

const saveHistory = (history) => {
    localStorage.setItem('simulacoesHistorico', JSON.stringify(history));
};

/**
 * Carrega e renderiza as simulações do usuário logado.
 */
function loadHistory() {
    const userId = parseInt(localStorage.getItem('idUsuario'));
    const allHistory = getHistory();
    
    // Filtra o histórico apenas para o usuário logado (Requisito 1)
    const userHistory = allHistory.filter(sim => sim.idUsuario === userId);
    
    renderTable(userHistory);
}

/**
 * Renderiza a tabela com as simulações, incluindo todas as colunas detalhadas.
 */
function renderTable(simulations) {
    const tableBody = document.getElementById('investmentTable');
    tableBody.innerHTML = ''; // Limpa as linhas existentes
    
    const COLUMNS_COUNT = 13; // 1 (Checkbox) + 12 colunas de dados
    
    if (simulations.length === 0) {
        const row = tableBody.insertRow();
        row.innerHTML = `<td colspan="${COLUMNS_COUNT}" class="text-center">Nenhuma simulação encontrada. Adicione uma na Calculadora!</td>`;
        return;
    }

    simulations.forEach(sim => {
        const row = tableBody.insertRow();
        // Armazena o ID da simulação na linha para fácil acesso
        row.setAttribute('data-id', sim.id);
        
        // Garante que todos os campos existam para evitar erros de renderização
        const valorInicial = sim.valorInicial || 0;
        const valorFinalLiquido = sim.valorFinalLiquido || 0;
        const rendimentoBruto = sim.rendimentoBruto || 0;
        
        // NOVOS DETALHES DE IMPOSTOS
        const impostoIR = sim.impostoIR || 0;
        const impostoIOF = sim.impostoIOF || 0;
        const taxasAdmin = sim.taxas || 0;
        
        const lucroLiquido = sim.lucroLiquido || (valorFinalLiquido - valorInicial);
        const percentual = sim.percentual || 0;
        
        row.innerHTML = `
            <td><input type="checkbox" class="row-select" data-id="${sim.id}"></td>
            <td class="text-left">${sim.dataHora}</td>
            <td class="text-center">${sim.tipo || 'N/A'}</td>
            <td class="text-right">${formatCurrency(valorInicial)}</td>
            <td class="text-center">${sim.tempoDias || 'N/A'}</td>
            <td class="text-center">${formatPercent(sim.rentabilidadePercentual || 0)}</td>
            <td class="text-right">${formatCurrency(rendimentoBruto)}</td>
            <td class="text-right">${formatCurrency(impostoIR)}</td>     <td class="text-right">${formatCurrency(impostoIOF)}</td>    <td class="text-right">${formatCurrency(taxasAdmin)}</td>    <td class="text-right">${formatCurrency(valorFinalLiquido)}</td>
            <td class="text-right">${formatCurrency(lucroLiquido)}</td>
            <td class="text-center">${formatPercent(percentual)}</td>
        `;
        
        // Aplica cores de lucro/prejuízo
        const lucroCell = row.cells[11]; 
        const percentualCell = row.cells[12]; 

        if (lucroLiquido < 0) {
            lucroCell.classList.add('error-text');
            percentualCell.classList.add('error-text');
        } else if (lucroLiquido > 0) {
            lucroCell.classList.add('success-text');
            percentualCell.classList.add('success-text');
        }
    });
    
    updateSelectAllState();
}

/**
 * Remove as simulações marcadas.
 */
function removeSelectedSimulations() {
    const selectedCheckboxes = document.querySelectorAll('#investmentTable .row-select:checked');
    if (selectedCheckboxes.length === 0) {
        alert("Selecione pelo menos uma simulação para remover.");
        return;
    }

    if (!confirm(`Tem certeza que deseja remover ${selectedCheckboxes.length} simulação(ões)?`)) {
        return;
    }

    const idsToRemove = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.id));
    
    let allHistory = getHistory();
    
    // Filtra a lista de histórico, removendo os itens selecionados
    allHistory = allHistory.filter(sim => !idsToRemove.includes(sim.id));
    
    saveHistory(allHistory);
    loadHistory(); // Recarrega e renderiza a tabela atualizada
}

/**
 * Controla o checkbox 'Selecionar Todos'.
 */
function toggleSelectAll(event) {
    const isChecked = event.target.checked;
    document.querySelectorAll('#investmentTable .row-select').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

/**
 * Atualiza o estado do checkbox 'Selecionar Todos' baseado nos checkboxes das linhas.
 */
function updateSelectAllState() {
    const allRows = document.querySelectorAll('#investmentTable .row-select');
    const selectedRows = document.querySelectorAll('#investmentTable .row-select:checked');
    const selectAllCheckbox = document.getElementById('selectAll');

    if (selectAllCheckbox) {
        if (allRows.length === 0) {
             selectAllCheckbox.checked = false;
             selectAllCheckbox.disabled = true;
        } else {
             selectAllCheckbox.disabled = false;
             selectAllCheckbox.checked = allRows.length === selectedRows.length;
        }
    }
}