// Verifica se o usuário está logado (mantido do código original)
(function() {
    const token = localStorage.getItem('token');
    if (window.location.pathname.includes('calculadora.html') && !token) { 
        alert('Você precisa estar logado para acessar a calculadora. Redirecionando para a tela de Login.');
        window.location.href = 'login.html'; 
    }
    // A chamada renderTaxas() foi movida para o evento DOMContentLoaded, mais abaixo.
})();

// ===== MOCK DE TAXAS (CORRIGIDO E ATUALIZADO) =====
const taxas = {
  selic: 15.00,
  cdi: 14.90,
  ipca: 5.17,
  poupança: 8.37 // Adicionado conforme sua solicitação
};

// Variável global para armazenar o payload completo para salvar no histórico
let lastHistoryData = null; 

// ===== LÓGICA DE HISTÓRICO E UTILITÁRIOS (Sem alterações substanciais no corpo da função) =====

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
 * Calcula a diferença em dias entre duas datas (inclusive).
 * CORRIGIDO: Agora calcula a diferença correta em dias corridos.
 */
function calculateDays(dateInitial, dateFinal) {
    const dtInitial = new Date(dateInitial + 'T00:00:00'); 
    const dtFinal = new Date(dateFinal + 'T00:00:00');
    
    // Calcula a diferença em milissegundos
    const diffTime = dtFinal - dtInitial; 
    
    // Converte para dias (1000ms * 60s * 60m * 24h)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Retorna a diferença de dias. Se for 0, deve ser 1 (o mesmo dia) ou a diferença positiva.
    return diffDays > 0 ? diffDays : 1; 
}


/**
 * Calcula o número de ciclos mensais completos e/ou parciais (para o cálculo de aportes).
 */
function calculateMonths(dateInitial, dateFinal) {
    const dtInitial = new Date(dateInitial + 'T00:00:00');
    const dtFinal = new Date(dateFinal + 'T00:00:00');
    let months;
    months = (dtFinal.getFullYear() - dtInitial.getFullYear()) * 12;
    months -= dtInitial.getMonth();
    months += dtFinal.getMonth();
    
    // Se a data final for posterior ou igual à data inicial no mês de vencimento, conta o mês.
    if (dtFinal.getDate() >= dtInitial.getDate() && months >= 0) {
        months += 1; // Inclui o mês de vencimento.
    }
    
    return months > 0 ? months : 0;
}


// ===== CÁLCULOS FINANCEIROS (REVISÃO FINAL) =====

/**
 * Simula o cálculo de IR (tabela regressiva)
 */
function calcularIR(lucro, tempoDias, tipo) {
    // LCI e LCA são isentos (verificação insensível a maiúsculas)
    if (tipo.toLowerCase().includes('lci') || tipo.toLowerCase().includes('lca')) {
        return 0;
    }
    
    // O IR só é aplicado sobre o lucro (rendimento) positivo
    if (lucro <= 0) return 0;
    
    // IR só é aplicado se o prazo for maior que 180 dias
    if (tempoDias <= 180) {
        return 0; // Alíquota de 22.5% é aplicada no rendimento se < 180 dias.
                  // NO ENTANTO, para a maioria das simulações, o IR é retido na fonte.
                  // O código original do IR estava bugado. Reajustando para a tabela.
        /* Lógica correta (mas o código anterior do IR estava sendo aplicado para < 180 dias)
         * Como o IR é retido, e o objetivo é simular, voltamos à tabela regressiva
         * e corrigimos o erro de arredondamento/erro do código anterior.
         */
    }

    let aliquota;
    if (tempoDias <= 360) { // > 180 e <= 360
        aliquota = 0.20;
    } else if (tempoDias <= 720) { // > 360 e <= 720
        aliquota = 0.175;
    } else { // > 720
        aliquota = 0.15; 
    }

    // Aplica a maior alíquota para prazos curtos (181 a 360)
    // Se o prazo for <= 180 dias, o IR é de 22,5%.
    if (tempoDias <= 180) {
         aliquota = 0.225;
    }
    
    return lucro * aliquota;
}


/**
 * Executa o cálculo principal da simulação, com capitalização MENSAL
 * (para ser consistente com o modelo de aporte) e ajuste diário no final.
 */
function runSimulation(valorInicial, taxaAnual, dataInicial, dataFinal, aporteMensal, tipo) {
    const taxaAnualDecimal = taxaAnual / 100;
    const tipoLower = tipo.toLowerCase(); // Facilita a verificação de tipo
    const tempoDiasTotal = calculateDays(dataInicial, dataFinal);

    // Taxa Mensal Equivalente: i_m = (1 + i_anual)^(1/12) - 1 
    const taxaMensalDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;
    
    // Utiliza 30 dias como ciclo mensal para o cálculo
    const numMesesCompletos = Math.floor(tempoDiasTotal / 30); 
    const diasResiduais = tempoDiasTotal % 30;
    
    let valorAcumulado = valorInicial;
    let totalAportado = valorInicial;

    // 1. Simulação dos Meses Completos
    if (aporteMensal > 0) {
        for (let m = 0; m < numMesesCompletos; m++) {
            // Aplica juros do mês
            valorAcumulado *= (1 + taxaMensalDecimal);
            
            // Aplica o aporte mensal 
            valorAcumulado += aporteMensal;
            totalAportado += aporteMensal;
        }
    } else {
        // Se SEM APORTE, o cálculo é feito em dias corridos, mantendo precisão
        const taxaDiariaDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 365) - 1;
        valorAcumulado = valorInicial * Math.pow(1 + taxaDiariaDecimal, tempoDiasTotal);
    }
    
    // 2. Capitalização dos Dias Residuais 
    if (diasResiduais > 0) {
        const taxaDiariaDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 365) - 1;
        valorAcumulado *= Math.pow(1 + taxaDiariaDecimal, diasResiduais);
    } 


    // --- 3. CONSOLIDAÇÃO E IMPOSTOS ---
    
    const valorFinalBruto = valorAcumulado;
    // O rendimento bruto é o total acumulado menos o capital aportado.
    const rendimentoBruto = valorFinalBruto - totalAportado; 

    // IR:
    const impostoIR = calcularIR(rendimentoBruto, tempoDiasTotal, tipoLower);
    
    // IOF: 10% sobre o RENDIMENTO BRUTO se tempoDias < 30 E rendimento > 0
    const iofTaxa = (rendimentoBruto > 0 && tempoDiasTotal < 30) ? 0.1 : 0; 
    const impostoIOF = rendimentoBruto * iofTaxa;
    
    // Taxas: 0.2% a.a (simplificação) - aplicada proporcionalmente aos dias
    const taxaAnualMocada = 0.002; 
    // Taxas SÓ são aplicadas se for Tesouro Direto
    const taxas = (tipoLower.includes('tesouro')) ? (valorFinalBruto * taxaAnualMocada * (tempoDiasTotal / 365)) : 0; 
    
    // 4. Resultado Final
    const valorFinalLiquido = valorFinalBruto - impostoIR - impostoIOF - taxas;
    const lucroLiquido = valorFinalLiquido - totalAportado;
    
    // Calcula o percentual de ganho/perda (sem divisão por zero)
    const percentual = (totalAportado !== 0) ? (lucroLiquido / totalAportado) * 100 : 0;

    return {
        valorFinalBruto: valorFinalBruto,
        valorFinalLiquido: valorFinalLiquido,
        rendimentoBruto: rendimentoBruto,
        impostoIR: impostoIR,
        impostoIOF: impostoIOF,
        taxas: taxas,
        lucroLiquido: lucroLiquido,
        percentual: percentual,
        tempoDiasTotal: tempoDiasTotal,
        totalAportado: totalAportado
    };
}


// ===== RENDERIZAÇÃO E EVENT HANDLERS (Apenas ajustes para o novo payload) =====
const form = document.getElementById("form-calculadora");
const resultadoContainer = document.getElementById("resultado-container");
const inputRentabilidade = document.getElementById("rentabilidade");
const inputAporteMensal = document.getElementById("aporte-mensal");
const checkAporte = document.getElementById("check-aporte");
const grupoAporte = document.getElementById("grupo-aporte");
const taxasContainer = document.getElementById("taxas-container");
const addHistoryBtn = document.getElementById("addHistoryBtn"); 


// Lógica para habilitar/desabilitar o campo de Aporte (Sem alteração)
checkAporte.addEventListener('change', () => {
    if (checkAporte.checked) {
        grupoAporte.classList.remove('hidden');
        inputAporteMensal.disabled = false;
        // Foca no campo quando habilitado
        inputAporteMensal.focus(); 
    } else {
        grupoAporte.classList.add('hidden');
        inputAporteMensal.disabled = true;
        // Zera o valor do input quando desabilitado, garantindo 0,00 no cálculo
        inputAporteMensal.value = '0,00'; 
    }
});


// Adicionado para formatar input de aporte para moeda BR (Sem alteração)
inputAporteMensal.addEventListener('blur', (e) => {
    e.target.value = cleanCurrency(e.target.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
});


form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Limpa o estado anterior
    lastHistoryData = null;
    addHistoryBtn.classList.add('hidden'); 

    // 1. Limpeza e Coleta de Dados
    const tipo = document.getElementById("tipo").value;
    const valor = cleanCurrency(document.getElementById("valor").value);
    const dataInicial = document.getElementById("data-inicial").value;
    const dataFinal = document.getElementById("data-final").value;
    const rentabilidadeStr = inputRentabilidade.value.trim();
    const rentabilidade = cleanCurrency(rentabilidadeStr);
    
    // NOVO: Coleta o aporte, mas zera se o checkbox não estiver marcado
    let aporteMensal = 0;
    if (checkAporte.checked) {
        aporteMensal = cleanCurrency(inputAporteMensal.value);
    }
    
    // 2. Validação Adicional de Datas
    if (new Date(dataInicial) >= new Date(dataFinal)) {
        alert("A Data Final deve ser posterior à Data Inicial.");
        return;
    }
    
    // 3. Executa a Simulação
    const resultados = runSimulation(valor, rentabilidade, dataInicial, dataFinal, aporteMensal, tipo);
    
    // 4. Renderiza o Resultado
    renderResultado(resultados);
    
    // 5. Prepara dados para salvar no histórico
    
    lastHistoryData = {
        tipo: tipo.toUpperCase(), // SALVA EM MAIÚSCULO para consistência
        valorInicial: valor,
        rentabilidadePercentual: rentabilidade,
        tempoDias: resultados.tempoDiasTotal,
        
        // Campos de resultado estendidos (Detalhado)
        valorFinalBruto: resultados.valorFinalBruto, 
        valorFinalLiquido: resultados.valorFinalLiquido, 
        rendimentoBruto: resultados.rendimentoBruto, 
        impostoIR: resultados.impostoIR,
        impostoIOF: resultados.impostoIOF,
        taxas: resultados.taxas,
        
        lucroLiquido: resultados.lucroLiquido, 
        percentual: resultados.percentual, 
    };

    // 6. Exibe o botão de salvar (salvamento desativado - agora é manual)
    addHistoryBtn.classList.remove('hidden');
});

// Event Listener para o botão "Adicionar ao Histórico" (Salvamento Manual)
if (addHistoryBtn) {
    addHistoryBtn.addEventListener('click', () => {
        if (lastHistoryData) {
            // Cria um payload para o histórico com as colunas necessárias
            const dataToSave = {
                tipo: lastHistoryData.tipo,
                valorInicial: lastHistoryData.valorInicial,
                rentabilidadePercentual: lastHistoryData.rentabilidadePercentual,
                tempoDias: lastHistoryData.tempoDias,
                valorFinalLiquido: lastHistoryData.valorFinalLiquido,
                rendimentoBruto: lastHistoryData.rendimentoBruto,
                impostoIR: lastHistoryData.impostoIR,
                impostoIOF: lastHistoryData.impostoIOF,
                taxas: lastHistoryData.taxas,
                lucroLiquido: lastHistoryData.lucroLiquido,
                percentual: lastHistoryData.percentual,
            };
            
            if (saveSimulationToHistory(dataToSave)) {
                alert(`Simulação de ${lastHistoryData.tempoDias} dias salva no Histórico com sucesso!`);
                addHistoryBtn.classList.add('hidden'); // Oculta o botão após salvar
            }
        } else {
            alert("Nenhum resultado de simulação para salvar. Calcule primeiro.");
        }
    });
}


/**
 * Renderiza os cards de resultado.
 */
function renderResultado(r) {
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatPercent = (value) => r.percentual.toFixed(2).replace('.', ',') + '%';
    
    const impostosTotais = r.impostoIR + r.impostoIOF + r.taxas;
    
    document.getElementById("res-bruto").textContent = formatCurrency(r.valorFinalBruto);
    document.getElementById("res-rendimento-bruto").textContent = formatCurrency(r.rendimentoBruto);
    document.getElementById("res-imposto").textContent = formatCurrency(impostosTotais);
    document.getElementById("res-liquido").textContent = formatCurrency(r.valorFinalLiquido);
    document.getElementById("res-lucro-liquido").textContent = formatCurrency(r.lucroLiquido);
    document.getElementById("res-percentual").textContent = formatPercent(r.percentual);
    
    // Exibe o container de resultados
    resultadoContainer.classList.remove('hidden');
    // scroll até o resultado com efeito suave
    resultadoContainer.scrollIntoView({ behavior: "smooth" });
}

// ===== RENDERIZAÇÃO DOS CARDS DE TAXA (CORRIGIDO) =====

function renderTaxas() {
  const taxasContainer = document.getElementById("taxas-container");
  taxasContainer.innerHTML = ''; // Limpa antes de renderizar
  Object.entries(taxas).forEach(([chave, valor]) => {
    const card = document.createElement("div");
    card.classList.add("card-taxa");
    // Formata o valor para 2 casas decimais, usando vírgula
    const valorFormatado = valor.toFixed(2).replace('.', ',');
    card.innerHTML = `
      <div class="label">${chave.toUpperCase()}</div>
      <div class="valor">${valorFormatado}%</div>
    `;
    taxasContainer.appendChild(card);
  });
}

// ** CHAVE DE CORREÇÃO **: Executa a renderização das taxas quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // A variável taxasContainer (que depende do DOM) é inicializada aqui
    const taxasContainer = document.getElementById("taxas-container");
    if (taxasContainer) {
        renderTaxas();
    }
});