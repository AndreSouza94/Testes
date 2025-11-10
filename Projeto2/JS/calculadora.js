// Verifica se o usuário está logado (mantido do código original)
(function() {
    const token = localStorage.getItem('token');
    if (window.location.pathname.includes('calculadora.html') && !token) { 
        alert('Você precisa estar logado para acessar a calculadora. Redirecionando para a tela de Login.');
        window.location.href = 'login.html'; 
    }
    // A chamada renderTaxas() foi movida para o evento DOMContentLoaded, mais abaixo.
})();

// Variável global para armazenar a instância do gráfico
let chartInstance = null;

// ===== MOCK DE TAXAS (MANTIDO) =====
const taxas = {
  selic: 15.00,
  cdi: 14.90,
  ipca: 5.17,
  poupança: 8.37 // Adicionado conforme sua solicitação
};

// Variável global para armazenar o payload completo para salvar no histórico
let lastHistoryData = null; 

// ===== LÓGICA DE HISTÓRICO E UTILITÁRIOS (MANTIDO) =====

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
 */
function calculateDays(dateInitial, dateFinal) {
    const dtInitial = new Date(dateInitial + 'T00:00:00'); 
    const dtFinal = new Date(dateFinal + 'T00:00:00');
    
    const diffTime = dtFinal - dtInitial; 
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 1; 
}


/**
 * Calcula o número de ciclos mensais.
 */
function calculateMonths(dateInitial, dateFinal) {
    const dtInitial = new Date(dateInitial + 'T00:00:00');
    const dtFinal = new Date(dateFinal + 'T00:00:00');
    let months;
    months = (dtFinal.getFullYear() - dtInitial.getFullYear()) * 12;
    months -= dtInitial.getMonth();
    months += dtFinal.getMonth();
    
    if (dtFinal.getDate() >= dtInitial.getDate() && months >= 0) {
        months += 1;
    }
    
    return months > 0 ? months : 0;
}


// ===== CÁLCULOS FINANCEIROS (MANTIDO) =====

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
    
    let aliquota;
    
    // Aplica a alíquota correta baseada no tempoDias
    if (tempoDias <= 180) {
        aliquota = 0.225;
    } else if (tempoDias <= 360) {
        aliquota = 0.20;
    } else if (tempoDias <= 720) {
        aliquota = 0.175;
    } else {
        aliquota = 0.15; 
    }
    
    return lucro * aliquota;
}


/**
 * Executa o cálculo principal da simulação, e agora GERA A SÉRIE MENSAL.
 */
function runSimulation(valorInicial, taxaAnual, dataInicial, dataFinal, aporteMensal, tipo) {
    const taxaAnualDecimal = taxaAnual / 100;
    const tipoLower = tipo.toLowerCase(); // Facilita a verificação de tipo
    const tempoDiasTotal = calculateDays(dataInicial, dataFinal);

    const taxaMensalDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;
    const taxaDiariaDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 365) - 1;
    
    const numMesesCompletos = Math.floor(tempoDiasTotal / 30); 
    const diasResiduais = tempoDiasTotal % 30;
    
    let valorAcumulado = valorInicial;
    let totalAportado = valorInicial;
    
    // --- Geração da Série para Gráfico ---
    const monthlySeries = [];
    
    // Ponto inicial
    monthlySeries.push({
        periodo: 'Mês 0',
        patrimonio: valorInicial,
        aportado: valorInicial
    });

    // 1. Simulação dos Meses Completos
    if (aporteMensal > 0) {
        for (let m = 0; m < numMesesCompletos; m++) {
            
            // Aplica juros do mês
            valorAcumulado *= (1 + taxaMensalDecimal);
            
            // Aplica o aporte mensal 
            valorAcumulado += aporteMensal;
            totalAportado += aporteMensal;
            
            monthlySeries.push({
                periodo: `Mês ${m + 1}`,
                patrimonio: valorAcumulado,
                aportado: totalAportado
            });
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
    
    // Atualiza o último ponto da série se houver dias residuais ou for uma série curta sem aporte
    if (monthlySeries.length > 1 || aporteMensal === 0) {
        const ultimoIndice = monthlySeries.length - 1;
        
        if (aporteMensal === 0) {
             // Para simulações sem aporte, calcula apenas o ponto final
             const taxaDiariaDecimal = Math.pow(1 + taxaAnualDecimal, 1 / 365) - 1;
             const valorFinalSemAporte = valorInicial * Math.pow(1 + taxaDiariaDecimal, tempoDiasTotal);
             
             // Limpa e adiciona apenas os pontos inicial e final
             monthlySeries.length = 0;
             monthlySeries.push({ periodo: 'Mês 0', patrimonio: valorInicial, aportado: valorInicial });
             monthlySeries.push({ periodo: `${tempoDiasTotal} dias (Final)`, patrimonio: valorFinalSemAporte, aportado: valorInicial });
             
        } else if (diasResiduais > 0) {
             // Atualiza o último ponto da série com o valor final preciso
             monthlySeries[ultimoIndice] = {
                 periodo: monthlySeries[ultimoIndice].periodo.replace('Mês', 'Mês Final'),
                 patrimonio: valorAcumulado,
                 aportado: totalAportado 
             };
        }
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
    
    // Taxas: 0.2% a.a (simulação de taxa de custódia do Tesouro)
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
        totalAportado: totalAportado,
        // DADOS PARA O GRÁFICO
        monthlySeries: monthlySeries 
    };
}


// ===== RENDERIZAÇÃO E EVENT HANDLERS (Chamada ao Gráfico) =====
const form = document.getElementById("form-calculadora");
const resultadoContainer = document.getElementById("resultado-container");
const chartSection = document.getElementById("chart-section");
const inputRentabilidade = document.getElementById("rentabilidade");
const inputAporteMensal = document.getElementById("aporte-mensal");
const checkAporte = document.getElementById("check-aporte");
const grupoAporte = document.getElementById("grupo-aporte");
const taxasContainer = document.getElementById("taxas-container");
const addHistoryBtn = document.getElementById("addHistoryBtn"); 


// Lógica para habilitar/desabilitar o campo de Aporte (Mantido)
checkAporte.addEventListener('change', () => {
    if (checkAporte.checked) {
        grupoAporte.classList.remove('hidden');
        inputAporteMensal.disabled = false;
        inputAporteMensal.focus(); 
    } else {
        grupoAporte.classList.add('hidden');
        inputAporteMensal.disabled = true;
        inputAporteMensal.value = '0,00'; 
    }
});


// Adicionado para formatar input de aporte para moeda BR (Mantido)
inputAporteMensal.addEventListener('blur', (e) => {
    e.target.value = cleanCurrency(e.target.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
});


form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    lastHistoryData = null;
    addHistoryBtn.classList.add('hidden'); 
    chartSection.classList.add('hidden'); // Oculta o gráfico antes do cálculo

    // 1. Coleta de Dados (Mantido)
    const tipo = document.getElementById("tipo").value;
    const valor = cleanCurrency(document.getElementById("valor").value);
    const dataInicial = document.getElementById("data-inicial").value;
    const dataFinal = document.getElementById("data-final").value;
    const rentabilidadeStr = inputRentabilidade.value.trim();
    const rentabilidade = cleanCurrency(rentabilidadeStr);
    
    let aporteMensal = 0;
    if (checkAporte.checked) {
        aporteMensal = cleanCurrency(inputAporteMensal.value);
    }
    
    // 2. Validação (Mantido)
    if (new Date(dataInicial) >= new Date(dataFinal)) {
        alert("A Data Final deve ser posterior à Data Inicial.");
        return;
    }
    
    // 3. Executa a Simulação
    const resultados = runSimulation(valor, rentabilidade, dataInicial, dataFinal, aporteMensal, tipo);
    
    // 4. Renderiza o Resultado
    renderResultado(resultados);
    
    // 5. Renderiza o Gráfico (NOVO)
    renderChart(resultados.monthlySeries);
    
    // 6. Prepara dados para salvar no histórico (Mantido)
    lastHistoryData = {
        tipo: tipo.toUpperCase(), 
        valorInicial: valor,
        rentabilidadePercentual: rentabilidade,
        tempoDias: resultados.tempoDiasTotal,
        valorFinalBruto: resultados.valorFinalBruto, 
        valorFinalLiquido: resultados.valorFinalLiquido, 
        rendimentoBruto: resultados.rendimentoBruto, 
        impostoIR: resultados.impostoIR,
        impostoIOF: resultados.impostoIOF,
        taxas: resultados.taxas,
        lucroLiquido: resultados.lucroLiquido, 
        percentual: resultados.percentual, 
    };

    // 7. Exibe o botão de salvar (Mantido)
    addHistoryBtn.classList.remove('hidden');
});

// Event Listener para o botão "Adicionar ao Histórico" (Mantido)
if (addHistoryBtn) {
    addHistoryBtn.addEventListener('click', () => {
        if (lastHistoryData) {
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
                addHistoryBtn.classList.add('hidden');
            }
        } else {
            alert("Nenhum resultado de simulação para salvar. Calcule primeiro.");
        }
    });
}


/**
 * Renderiza os resultados numéricos.
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
    
    resultadoContainer.classList.remove('hidden');
    resultadoContainer.scrollIntoView({ behavior: "smooth" });
}

/**
 * FUNÇÃO PARA RENDERIZAR O GRÁFICO (AGORA ROBUSTA)
 */
function renderChart(seriesData) {
    const chartContainer = document.querySelector('#chart-section .form-container');
    const chartSection = document.getElementById("chart-section");
    
    // ⚠️ CORREÇÃO 1: Verifica a existência do objeto global Chart.js
    if (typeof Chart === 'undefined') {
        chartSection.classList.remove('hidden');
        chartContainer.innerHTML = '<p class="text-center" style="color: #ccc; padding: 20px;">ERRO: Biblioteca Chart.js não carregada. Adicione o script ao HTML para visualizar o gráfico.</p>';
        return; 
    }
    
    // ⚠️ CORREÇÃO 2: Destrói a instância ANTES de recriar o canvas
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    // ⚠️ CORREÇÃO 3: Limpa e recria o canvas para evitar erros de re-renderização
    chartContainer.innerHTML = '<canvas id="patrimonio-chart"></canvas>';
    const chartCanvas = document.getElementById('patrimonio-chart');
    
    try {
        const labels = seriesData.map(d => d.periodo);
        const patrimonio = seriesData.map(d => d.patrimonio);
        const aportado = seriesData.map(d => d.aportado);
        
        chartInstance = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Patrimônio Total (Valor de Mercado)',
                    data: patrimonio,
                    borderColor: '#ffa533', 
                    backgroundColor: 'rgba(255, 165, 51, 0.2)',
                    fill: true,
                    tension: 0.2
                }, {
                    label: 'Total Aportado (Capital Investido)',
                    data: aportado,
                    borderColor: '#007bff', 
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    fill: false,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Valor (R$)',
                            color: '#ccc'
                        },
                        ticks: {
                            color: '#ccc',
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Período',
                            color: '#ccc'
                        },
                        ticks: {
                            color: '#ccc'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff' 
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += 'R$ ' + context.parsed.y.toFixed(2).replace('.', ',');
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        chartSection.classList.remove('hidden');
        chartSection.scrollIntoView({ behavior: "smooth" });

    } catch (e) {
        // Garante que o usuário veja a área do gráfico e um erro amigável
        console.error("Erro ao renderizar o gráfico Chart.js:", e);
        chartSection.classList.remove('hidden');
        chartContainer.innerHTML = '<p class="text-center" style="color: #ccc; padding: 20px;">Houve um erro interno ao gerar o gráfico. O cálculo funcionou, mas a visualização falhou. Verifique o console para detalhes.</p>';
        chartInstance = null;
        return;
    }
}

// ===== RENDERIZAÇÃO DOS CARDS DE TAXA (MANTIDO) =====

function renderTaxas() {
  const taxasContainer = document.getElementById("taxas-container");
  taxasContainer.innerHTML = ''; 
  Object.entries(taxas).forEach(([chave, valor]) => {
    const card = document.createElement("div");
    card.classList.add("card-taxa");
    const valorFormatado = valor.toFixed(2).replace('.', ',');
    card.innerHTML = `
      <div class="label">${chave.toUpperCase()}</div>
      <div class="valor">${valorFormatado}%</div>
    `;
    taxasContainer.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
    const taxasContainer = document.getElementById("taxas-container");
    if (taxasContainer) {
        renderTaxas();
    }
});