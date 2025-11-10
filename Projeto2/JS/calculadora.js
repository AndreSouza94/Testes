// Verifica se o usuário está logado (mantido do código original)
(function() {
    const token = localStorage.getItem('token');
    if (window.location.pathname.includes('calculadora.html') && !token) { 
        alert('Você precisa estar logado para acessar a calculadora. Redirecionando para a tela de Login.');
        window.location.href = 'login.html'; 
    }
    // Renderiza as taxas (mantido do código original)
    renderTaxas();
})();

// ===== MOCK DE TAXAS (mantido do código original) =====
const taxas = {
  selic: 15,
  cdi: 14.9,
  ipca: 5.17,
  Poupança: 8.37
};

// Variável global para armazenar o último resultado líquido (para exportação, se necessário)
let lastSimulationData = null; 

// ===== LÓGICA DE HISTÓRICO E UTILITÁRIOS =====

/**
 * Funções auxiliares para localStorage (mantido do código original)
 */
const getHistory = () => {
    const history = localStorage.getItem('simulacoesHistorico');
    return history ? JSON.parse(history) : [];
};

const saveHistory = (history) => {
    localStorage.setItem('simulacoesHistorico', JSON.stringify(history));
};

function saveSimulationToHistory(data) {
    const userId = localStorage.getItem('idUsuario');
    if (!userId) {
        alert("Você precisa estar logado para salvar o histórico.");
        return false;
    }
    
    const history = getHistory();
    const newSimulation = {
        id: Date.now(), 
        idUsuario: parseInt(userId),
        dataHora: new Date().toLocaleString('pt-BR'), 
        ...data
    };

    history.push(newSimulation);
    saveHistory(history);
    return true;
}

/**
 * Converte valor formatado (ex: "100,50") em número (100.50).
 */
function cleanCurrency(value) {
    if (typeof value !== 'string') return parseFloat(value) || 0;
    // Remove pontos de milhar e troca vírgula decimal por ponto
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

/**
 * Calcula a diferença em dias entre duas datas.
 */
function calculateDays(dateInitial, dateFinal) {
    const dtInitial = new Date(dateInitial + 'T00:00:00'); // Adiciona T00:00:00 para evitar fuso horário
    const dtFinal = new Date(dateFinal + 'T00:00:00');
    // Calcula a diferença em milissegundos
    const diffTime = Math.abs(dtFinal - dtInitial);
    // Converte para dias (1000ms * 60s * 60m * 24h)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia final
    return diffDays;
}

/**
 * Calcula a diferença em meses completos, arredondando para baixo.
 */
function calculateMonths(dateInitial, dateFinal) {
    const dtInitial = new Date(dateInitial + 'T00:00:00');
    const dtFinal = new Date(dateFinal + 'T00:00:00');
    let months;
    months = (dtFinal.getFullYear() - dtInitial.getFullYear()) * 12;
    months -= dtInitial.getMonth();
    months += dtFinal.getMonth();
    
    // Adiciona o mês atual se a data final for >= a data inicial
    if (dtFinal.getDate() >= dtInitial.getDate() && months > 0) {
        months += 1;
    }
    
    return months > 0 ? months : 0;
}


// ===== CÁLCULOS FINANCEIROS (MOCK SIMPLIFICADO) =====

/**
 * Simula o cálculo de IR (tabela regressiva)
 */
function calcularIR(lucro, tempoDias, tipo) {
    // LCI e LCA são isentos
    if (tipo.includes('lci') || tipo.includes('lca')) {
        return 0;
    }

    let aliquota;
    if (tempoDias <= 180) {
        aliquota = 0.225;
    } else if (tempoDias <= 360) {
        aliquota = 0.20;
    } else if (tempoDias <= 720) {
        aliquota = 0.175;
    } else {
        aliquota = 0.15; // Acima de 720 dias
    }

    return lucro * aliquota;
}


/**
 * Executa o cálculo principal da simulação, incluindo aportes mensais.
 * OBS: Esta é uma simulação de Frontend. O cálculo REAL deve ser feito no Backend.
 */
function runSimulation(valorInicial, taxaAnual, dataInicial, dataFinal, aporteMensal, tipo) {
    const taxaMensalDecimal = Math.pow(1 + (taxaAnual / 100), 1/12) - 1;
    const tempoMesesTotal = calculateMonths(dataInicial, dataFinal);
    const tempoDiasTotal = calculateDays(dataInicial, dataFinal);
    
    // Simula o cálculo mês a mês
    let valorAcumulado = valorInicial;
    let totalAportado = valorInicial;
    
    // Calcula juros compostos com aportes mensais (simplificação)
    for (let m = 0; m < tempoMesesTotal; m++) {
        // Aplica juros do mês
        valorAcumulado *= (1 + taxaMensalDecimal);
        
        // Aplica o aporte mensal
        if (m > 0) { // Aporte começa no 1º mês completo
            valorAcumulado += aporteMensal;
            totalAportado += aporteMensal;
        }
    }
    
    const valorFinalBruto = valorAcumulado;
    const rendimentoBruto = valorFinalBruto - totalAportado;

    // Cálculo dos Impostos (usando o tempo em dias)
    const impostoIR = calcularIR(rendimentoBruto, tempoDiasTotal, tipo);
    const impostoIOF = tempoDiasTotal < 30 ? (rendimentoBruto * 0.1) : 0; // IOF Simples Mock
    const taxas = 0; // Taxas administrativas (simplificação)
    
    const valorFinalLiquido = valorFinalBruto - impostoIR - impostoIOF - taxas;
    const lucroLiquido = valorFinalLiquido - totalAportado;
    
    // Calcula o percentual de ganho/perda
    const percentual = (lucroLiquido / totalAportado) * 100;

    return {
        valorFinalBruto: valorFinalBruto,
        valorFinalLiquido: valorFinalLiquido,
        rendimentoBruto: rendimentoBruto,
        impostoIR: impostoIR,
        impostoIOF: impostoIOF,
        taxas: taxas,
        lucroLiquido: lucroLiquido,
        percentual: percentual,
        tempoDiasTotal: tempoDiasTotal
    };
}


// ===== RENDERIZAÇÃO E EVENT HANDLERS =====
const form = document.getElementById("form-calculadora");
const resultadoContainer = document.getElementById("resultado-container");
const inputRentabilidade = document.getElementById("rentabilidade");
const inputAporteMensal = document.getElementById("aporte-mensal");


// Adicionado para formatar input de aporte para moeda BR
inputAporteMensal.addEventListener('blur', (e) => {
    e.target.value = cleanCurrency(e.target.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
});


form.addEventListener("submit", (e) => {
    e.preventDefault();

    // 1. Limpeza e Coleta de Dados
    const tipo = document.getElementById("tipo").value;
    const valor = cleanCurrency(document.getElementById("valor").value);
    const dataInicial = document.getElementById("data-inicial").value;
    const dataFinal = document.getElementById("data-final").value;
    const aporteMensal = cleanCurrency(document.getElementById("aporte-mensal").value);
    
    // Lida com ponto ou vírgula na rentabilidade
    const rentabilidadeStr = inputRentabilidade.value.trim();
    const rentabilidade = cleanCurrency(rentabilidadeStr);
    
    // 2. Validação Adicional de Datas
    if (new Date(dataInicial) > new Date(dataFinal)) {
        alert("A Data Final não pode ser anterior à Data Inicial.");
        return;
    }
    
    // 3. Executa a Simulação
    const resultados = runSimulation(valor, rentabilidade, dataInicial, dataFinal, aporteMensal, tipo);
    lastSimulationData = resultados;
    
    // 4. Renderiza o Resultado
    renderResultado(resultados);
    
    // 5. Prepara dados para salvar no histórico
    const dadosParaHistorico = {
        tipo: tipo.toUpperCase(),
        valorInicial: valor,
        dataInicial: dataInicial,
        dataFinal: dataFinal,
        rentabilidadePercentual: rentabilidade,
        aporteMensal: aporteMensal,
        
        // Campos de resultado solicitados no Item 4
        valorFinal: resultados.valorFinalLiquido, 
        lucroLiquido: resultados.lucroLiquido,
        rendimentoBruto: resultados.rendimentoBruto,
        impostoIR: resultados.impostoIR,
        percentual: resultados.percentual,
        tempoDias: resultados.tempoDiasTotal
    };

    if(saveSimulationToHistory(dadosParaHistorico)) {
        alert(`Simulação de ${resultados.tempoDiasTotal} dias salva no Histórico!`);
    }
});


/**
 * Renderiza os cards de resultado.
 */
function renderResultado(r) {
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatPercent = (value) => value.toFixed(2).replace('.', ',') + '%';
    
    document.getElementById("res-bruto").textContent = formatCurrency(r.valorFinalBruto);
    document.getElementById("res-rendimento-bruto").textContent = formatCurrency(r.rendimentoBruto);
    document.getElementById("res-imposto").textContent = formatCurrency(r.impostoIR + r.impostoIOF + r.taxas);
    document.getElementById("res-liquido").textContent = formatCurrency(r.valorFinalLiquido);
    document.getElementById("res-lucro-liquido").textContent = formatCurrency(r.lucroLiquido);
    document.getElementById("res-percentual").textContent = formatPercent(r.percentual);
    
    // scroll até o resultado com efeito suave
    resultadoContainer.scrollIntoView({ behavior: "smooth" });
}

// ===== RENDERIZAÇÃO DOS CARDS DE TAXA (Lógica mantida) =====
const taxasContainer = document.getElementById("taxas-container");

function renderTaxas() {
  Object.entries(taxas).forEach(([chave, valor]) => {
    const card = document.createElement("div");
    card.classList.add("card-taxa");
    card.innerHTML = `
      <div class="label">${chave.toUpperCase()}</div>
      <div class="valor">${valor}%</div>
    `;
    taxasContainer.appendChild(card);
  });
}