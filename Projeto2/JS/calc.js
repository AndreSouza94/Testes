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
    
    /**
     * Função principal de submissão do formulário.
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Bloqueia a UI durante o cálculo
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';

        // 1. Coletar e converter dados do formulário
        const data = {
            valorInicial: parseFloat(document.getElementById('initial-value').value),
            prazoMeses: parseInt(document.getElementById('term-months').value),
            taxaAnual: parseFloat(document.getElementById('annual-rate').value),
            aporteMensal: parseFloat(document.getElementById('monthly-contribution').value) || 0,
            tipoInvestimento: document.getElementById('investment-type').value
        };

        try {
            // 2. Chamar a API (definida em api.js)
            const result = await calculateInvestment(data); 

            // 3. Exibir resultados na tela
            displayResults(result);

            // 4. Mostrar a área de resultados
            resultsArea.classList.remove('hidden');

        } catch (error) {
            console.error('Erro de simulação:', error);
            // Mensagem de erro amigável ao usuário
            alert(`Falha na simulação: ${error.message || 'Verifique sua conexão com o Backend.'}`);

        } finally {
            // Libera a UI
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Simular Investimento';
        }
    });

    /**
     * Função para exibir os resultados na tela.
     * Assume que 'result' vem do Backend com todos os campos de valor.
     */
    const displayResults = (result) => {
        // O rendimento líquido é calculado no frontend para exibição, mas o valorLiquido deve vir do backend
        const rendimentoLiquido = result.rendimentoBruto - result.impostoRenda - result.iof - result.taxas;

        // Atualizar o DOM
        resultElements.grossValue.textContent = formatCurrency(result.valorBruto);
        resultElements.netValue.textContent = formatCurrency(result.valorLiquido);
        resultElements.grossProfit.textContent = formatCurrency(result.rendimentoBruto);
        
        // Formata e exibe IRRF
        const irrfValue = result.impostoRenda;
        resultElements.irrfTax.textContent = (irrfValue > 0) ? formatCurrency(irrfValue) : "Isento";
        resultElements.irrfTax.closest('.detail-item').classList.toggle('tax', irrfValue > 0);
        resultElements.irrfTax.closest('.detail-item').style.color = (irrfValue > 0) ? '' : 'var(--success-color)';

        // Formata e exibe IOF
        resultElements.iofTax.textContent = formatCurrency(result.iof);
        
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