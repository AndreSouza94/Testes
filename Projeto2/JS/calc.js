// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculator-form');
    const resultsArea = document.getElementById('results-area');
    const exportBtn = document.getElementById('export-csv-btn');
    const calculateBtn = document.getElementById('calculate-btn');

    // Mapeamento dos elementos de resultado
    const resultElements = {
        grossValue: document.getElementById('gross-value'),
        netValue: document.getElementById('net-value'),
        grossProfit: document.getElementById('gross-profit'),
        irrfTax: document.getElementById('irrf-tax'),
        iofTax: document.getElementById('iof-tax'),
        fees: document.getElementById('fees'),
        netProfit: document.getElementById('net-profit')
    };

    /**
     * Função auxiliar para formatar um número como moeda BRL.
     */
    const formatCurrency = (value) => {
        const numberValue = parseFloat(value);
        if (isNaN(numberValue)) return 'R$ 0,00';

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(numberValue);
    };

    // --- Lógica de Cálculo Implementada Localmente ---
    
    /**
     * Tabela regressiva do Imposto de Renda (IRRF) para Renda Fixa.
     * Prazo em meses.
     */
    const IR_TABLE = [
        { term: 0, rate: 22.5 },   // Até 180 dias (6 meses)
        { term: 6, rate: 20.0 },   // De 181 a 360 dias (6 a 12 meses)
        { term: 12, rate: 17.5 },  // De 361 a 720 dias (12 a 24 meses)
        { term: 24, rate: 15.0 }   // Acima de 720 dias (24 meses)
    ];

    /**
     * Função que calcula o investimento localmente (Juros Compostos).
     * @param {object} data - Dados do formulário.
     * @returns {object} O resultado da simulação.
     */
    const calculateInvestmentLocally = (data) => {
        const { valorInicial, prazoMeses, taxaAnual, aporteMensal } = data;
        const taxaMensal = (taxaAnual / 100) / 12;

        let valorAcumulado = valorInicial;
        let totalAportado = valorInicial;

        // 1. Cálculo de Juros Compostos (Mês a Mês)
        for (let i = 0; i < prazoMeses; i++) {
            // Adiciona o aporte
            valorAcumulado += aporteMensal;
            totalAportado += aporteMensal;

            // Calcula o rendimento do mês sobre o saldo atual
            valorAcumulado *= (1 + taxaMensal);
        }

        const rendimentoBruto = valorAcumulado - totalAportado;
        let impostoRenda = 0;
        let iof = 0;
        const taxas = 0; // Taxas de administração ou custódia, simplificadas como zero.

        // 2. Cálculo do Imposto de Renda (IRRF)
        const prazoDias = prazoMeses * (365 / 12); // Conversão aproximada para dias
        let irTaxRate = 0;
        
        // Encontra a alíquota de IR correta
        for (const item of IR_TABLE) {
            if (prazoMeses * 30.4167 >= item.term * 30.4167) { // Compara prazo em meses
                 irTaxRate = item.rate;
            } else {
                break;
            }
        }
        
        impostoRenda = rendimentoBruto * (irTaxRate / 100);

        // 3. Cálculo do IOF (Apenas para resgates em menos de 30 dias)
        // O cálculo real do IOF é complexo (regressivo sobre o rendimento)
        // Aqui, presumimos que o cálculo só é relevante e significativo se o prazo for muito curto.
        // Se o prazo for até 1 mês, assumimos que o IOF será aplicado sobre uma porção do rendimento.
        // Se for maior que 1 mês, o IOF é zero (regra geral).
        if (prazoMeses < 1) { // Menos de 30 dias - simplificação
            // IOF real tem uma tabela regressiva que vai de 96% a 0% sobre o rendimento.
            // Para simplificar localmente e demonstrar a existência do cálculo:
            if (prazoDias < 30) {
                 // Simplificação: aplica 10% de IOF sobre o rendimento total 
                 // O cálculo real requer a data exata e tabela de IOF diária.
                 iof = rendimentoBruto * 0.10; 
            }
        }

        // 4. Resultado final
        const valorLiquido = valorAcumulado - impostoRenda - iof - taxas;
        
        return {
            valorBruto: valorAcumulado,
            valorLiquido: valorLiquido,
            rendimentoBruto: rendimentoBruto,
            impostoRenda: impostoRenda,
            iof: iof,
            taxas: taxas 
        };
    };
    
    // --- Fim da Lógica de Cálculo Local ---

    /**
     * Função principal de submissão do formulário.
     */
    form.addEventListener('submit', async (e) => { // Mantido 'async' para boa prática, mas agora é síncrono.
        e.preventDefault();
        
        // Bloqueia a UI durante o cálculo
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';

        // 1. Coletar e converter dados do formulário
        const data = {
            valorInicial: parseFloat(document.getElementById('initial-value').value.replace(/\./g, '').replace(',', '.') || 0),
            prazoMeses: parseInt(document.getElementById('term-months').value || 0),
            taxaAnual: parseFloat(document.getElementById('annual-rate').value.replace(/\./g, '').replace(',', '.') || 0),
            aporteMensal: parseFloat(document.getElementById('monthly-contribution').value.replace(/\./g, '').replace(',', '.') || 0),
            tipoInvestimento: document.getElementById('investment-type').value
        };

        // Validação simples
        if (data.valorInicial <= 0 || data.prazoMeses <= 0 || data.taxaAnual <= 0) {
             alert('Por favor, preencha Valor Inicial, Prazo e Taxa Anual com valores positivos.');
             calculateBtn.disabled = false;
             calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Simular Investimento';
             return;
        }

        try {
            // 2. Chamar a função de cálculo local (Substitui a chamada à API)
            // Não é mais assíncrono, mas a estrutura Try/Catch foi mantida.
            const result = calculateInvestmentLocally(data); 

            // 3. Exibir resultados na tela
            displayResults(result);

            // 4. Mostrar a área de resultados
            resultsArea.classList.remove('hidden');

        } catch (error) {
            console.error('Erro de simulação local:', error);
            // Mensagem de erro amigável ao usuário
            alert(`Falha na simulação: ${error.message || 'Ocorreu um erro desconhecido no cálculo local.'}`);

        } finally {
            // Libera a UI
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Simular Investimento';
        }
    });

    /**
     * Função para exibir os resultados na tela.
     */
    const displayResults = (result) => {
        // O rendimento líquido é calculado no frontend para exibição, mas o valorLiquido deve vir do backend
        // Agora 'result' vem da função local.
        const rendimentoLiquido = result.rendimentoBruto - result.impostoRenda - result.iof - result.taxas;

        // Atualizar o DOM
        resultElements.grossValue.textContent = formatCurrency(result.valorBruto);
        resultElements.netValue.textContent = formatCurrency(result.valorLiquido);
        resultElements.grossProfit.textContent = formatCurrency(result.rendimentoBruto);
        
        // Formata e exibe IRRF
        const irrfValue = result.impostoRenda;
        resultElements.irrfTax.textContent = (irrfValue > 0) ? formatCurrency(irrfValue) : "Isento";
        // Ajusta a cor e classe (mantendo a lógica original do seu HTML/CSS)
        const irrfTaxItem = resultElements.irrfTax.closest('.detail-item');
        if(irrfTaxItem) {
            irrfTaxItem.classList.toggle('tax', irrfValue > 0);
            irrfTaxItem.style.color = (irrfValue > 0) ? '' : 'var(--success-color)';
        }

        // Formata e exibe IOF
        const iofValue = result.iof;
        resultElements.iofTax.textContent = (iofValue > 0) ? formatCurrency(iofValue) : "Isento";
         // Ajusta a cor e classe (mantendo a lógica original do seu HTML/CSS)
        const iofTaxItem = resultElements.iofTax.closest('.detail-item');
        if(iofTaxItem) {
            iofTaxItem.classList.toggle('tax', iofValue > 0);
            iofTaxItem.style.color = (iofValue > 0) ? '' : 'var(--success-color)';
        }
        
        // Formata e exibe Taxas
        resultElements.fees.textContent = formatCurrency(result.taxas);
        
        resultElements.netProfit.textContent = formatCurrency(rendimentoLiquido);
    };

    /**
     * Função para exportar os resultados para CSV.
     */
    exportBtn.addEventListener('click', () => {
        if (resultsArea.classList.contains('hidden')) {
            alert('Realize uma simulação antes de exportar.');
            return;
        }

        // Obtém os resultados exibidos na tela
        const results = {
            'Valor Inicial': document.getElementById('initial-value').value,
            'Prazo (Meses)': document.getElementById('term-months').value,
            'Taxa Anual (%)': document.getElementById('annual-rate').value,
            'Aporte Mensal (R$)': document.getElementById('monthly-contribution').value || '0',
            'Valor Final Bruto': resultElements.grossValue.textContent,
            'Valor Final Líquido': resultElements.netValue.textContent,
            'Rendimento Bruto': resultElements.grossProfit.textContent,
            'IRRF': resultElements.irrfTax.textContent,
            'IOF': resultElements.iofTax.textContent,
            'Taxas': resultElements.fees.textContent,
            'Rendimento Líquido Total': resultElements.netProfit.textContent
        };

        const csvContent = "data:text/csv;charset=utf-8,";
        const headers = Object.keys(results).join(';') + '\n';
        // Remove 'R$' e espaços para garantir valores numéricos no CSV
        const values = Object.values(results).map(v => 
            v.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()
        ).join(';') + '\n';
        
        const encodedUri = encodeURI(csvContent + headers + values);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "simulacao_renda_fixa.csv");
        document.body.appendChild(link); 
        link.click();
        document.body.removeChild(link);
    });
});