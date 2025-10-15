(function() {
    const token = localStorage.getItem('token');
    // Verifica se está na página da calculadora e se não há token
    if (window.location.pathname.includes('calculadora.html') && !token) { 
        alert('Você precisa estar logado para acessar a calculadora. Redirecionando para a tela de Login.');
        // Redireciona para a página de login
        window.location.href = 'login.html'; 
    }
})();
// ** Fim da Lógica de Restrição de Acesso **


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculator-form');
    const resultsArea = document.getElementById('results-area');
    const exportBtn = document.getElementById('export-csv-btn');
    const calculateBtn = document.getElementById('calculate-btn');

    // NOVAS REFERÊNCIAS DE ELEMENTOS CONDICIONAIS (RF19)
    const includeContributionCheck = document.getElementById('include-contribution-check');
    const monthlyContributionGroup = document.getElementById('monthly-contribution-group');
    const includeFeeCheck = document.getElementById('include-fee-check');
    const annualFeeGroup = document.getElementById('annual-fee-group');
    
    // Detalhes de Custo para visibilidade (RF18)
    const irrfDetail = document.getElementById('irrf-detail');
    const custodyFeeDetail = document.getElementById('custody-fee-detail');
    const iofDetail = document.getElementById('iof-detail');


    // Mapeamento dos elementos de resultado ATUALIZADO
    const resultElements = {
        grossValue: document.getElementById('gross-value'),    // RF08
        netValue: document.getElementById('net-value'),        // RF08
        grossProfit: document.getElementById('gross-profit'),  // RF09
        totalCosts: document.getElementById('total-costs'),    // RF10
        irrfTax: document.getElementById('irrf-tax'),          // RF11
        iofTax: document.getElementById('iof-tax'),            // RF11
        custodyFee: document.getElementById('custody-fee'),    // RF12
        totalCostsValue: document.getElementById('total-costs-value') // Total de Custos no detalhamento
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

    // --- Lógica para Campos Condicionais (RF19) ---
    // Aporte Mensal
    includeContributionCheck.addEventListener('change', (e) => {
        monthlyContributionGroup.style.display = e.target.checked ? 'block' : 'none';
        // Sugere um valor inicial de 100 ao ativar, 0 ao desativar
        document.getElementById('monthly-contribution').value = e.target.checked ? '100' : '0'; 
    });

    // Taxa de Custódia
    includeFeeCheck.addEventListener('change', (e) => {
        annualFeeGroup.style.display = e.target.checked ? 'block' : 'none';
        // Sugere um valor inicial de 0.25 ao ativar, 0 ao desativar
        document.getElementById('annual-fee').value = e.target.checked ? '0.25' : '0';
    });
    // --- Fim da Lógica Condicional ---

    // --- Lógica de Cálculo Implementada Localmente (ATUALIZADA) ---
    
    // Tabela regressiva do Imposto de Renda (IRRF) para Renda Fixa (RN04)
    // Prazo em dias
    const IR_TABLE = [
        { days: 720, rate: 15.0 },  // Acima de 720 dias: 15%
        { days: 361, rate: 17.5 },  // De 361 a 720 dias: 17.5%
        { days: 181, rate: 20.0 },  // De 181 a 360 dias: 20%
        { days: 0, rate: 22.5 }    // Até 180 dias: 22.5%
    ];
    
    // Títulos Isentos de IR (RN05)
    const IR_EXEMPT_TYPES = ['lci', 'lca', 'cri', 'cra'];

    /**
     * Função que calcula o investimento localmente (Juros Compostos).
     */
    const calculateInvestmentLocally = (data) => {
        const { valorInicial, prazoAnos, taxaAnual, aporteMensal, tipoInvestimento, taxaCustodiaAnual } = data;
        
        const prazoMeses = Math.round(prazoAnos * 12); 
        const prazoDias = Math.round(prazoAnos * 365.25); 

        let taxaNominalMensal = (taxaAnual / 100) / 12;
        let taxaCustodiaMensal = (taxaCustodiaAnual / 100) / 12; // RN06: Converte taxa de custódia anual para mensal
        
        // RN06: A taxa real é a taxa nominal menos a taxa de custódia
        let taxaRealMensal = taxaNominalMensal - taxaCustodiaMensal;
        if (taxaRealMensal < 0) taxaRealMensal = 0;

        let valorAcumulado = valorInicial;
        let totalAportado = valorInicial;
        
        // 1. Cálculo do Valor Futuro com Aportes (RN01)
        for (let i = 0; i < prazoMeses; i++) {
            // Valor Futuro = Valor Acumulado * (1 + taxa_real_mensal)
            valorAcumulado *= (1 + taxaRealMensal);
            
            // Simulação de aporte no final do mês, junto com o rendimento
            if (i < prazoMeses - 1) { 
                valorAcumulado += aporteMensal;
                totalAportado += aporteMensal;
            }
        }
        
        // Lucro Bruto (RN02)
        const lucroBruto = valorAcumulado - totalAportado;
        
        let iof = 0;
        // 2. Cálculo do IOF (RN03)
        if (prazoDias < 30) {
            // Simplificação do IOF regressivo: 10% sobre o lucro para prazos muito curtos
            iof = lucroBruto * 0.10; 
        }

        // Lucro Líquido (para IRRF)
        let lucroLiquidoIR = lucroBruto - iof;
        if (lucroLiquidoIR < 0) lucroLiquidoIR = 0; 
        
        let impostoRenda = 0;
        
        // 3. Isenção de IRRF (RN05)
        const isentoIR = IR_EXEMPT_TYPES.includes(tipoInvestimento.toLowerCase());

        if (!isentoIR) {
            // Encontra a alíquota de IR correta (RN04)
            let irTaxRate = 0;
            for (const item of IR_TABLE) {
                if (prazoDias >= item.days) {
                     irTaxRate = item.rate;
                     break;
                }
            }
            
            impostoRenda = lucroLiquidoIR * (irTaxRate / 100);
        }

        // Custo Total (RF10/RF12) - Valor Nominal da Taxa de Custódia para Exibição
        // A dedução real já está no cálculo acima.
        const valorNominalTaxaCustodia = valorInicial * (taxaCustodiaAnual / 100) * prazoAnos; 
        
        // Custo Total (RF10: Soma dos impostos e taxas)
        const custoTotal = impostoRenda + iof + valorNominalTaxaCustodia; 

        // Valor Líquido (Valor Final Bruto - Impostos - IOF) (RF08)
        const valorLiquido = valorAcumulado - (impostoRenda + iof);
        
        return {
            valorBruto: valorAcumulado,
            valorLiquido: valorLiquido,
            rendimentoBruto: lucroBruto, 
            impostoRenda: impostoRenda,
            iof: iof,
            taxaCustodia: valorNominalTaxaCustodia, // Valor nominal para exibição
            isentoIR: isentoIR,
            custoTotal: custoTotal 
        };
    };
    
    // --- Fim da Lógica de Cálculo Local ---

    /**
     * Função principal de submissão do formulário.
     */
    form.addEventListener('submit', (e) => { 
        e.preventDefault();
        
        // Bloqueia a UI
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';

        // 1. Coletar e converter dados do formulário
        const data = {
            valorInicial: parseFloat(document.getElementById('initial-value').value.replace(/\./g, '').replace(',', '.') || 0),
            prazoAnos: parseFloat(document.getElementById('term-years').value.replace(/\./g, '').replace(',', '.') || 0), 
            taxaAnual: parseFloat(document.getElementById('annual-rate').value.replace(/\./g, '').replace(',', '.') || 0),
            aporteMensal: parseFloat(document.getElementById('monthly-contribution').value.replace(/\./g, '').replace(',', '.') || 0),
            tipoInvestimento: document.getElementById('investment-type').value,
            taxaCustodiaAnual: parseFloat(document.getElementById('annual-fee').value.replace(/\./g, '').replace(',', '.') || 0), 
        };

        // Validação simples (RF15)
        if (data.valorInicial <= 0 || data.prazoAnos <= 0 || data.taxaAnual <= 0) {
             alert('Por favor, preencha Valor Inicial, Tempo e Taxa Anual com valores positivos.');
             calculateBtn.disabled = false;
             calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Calcular Investimento';
             return;
        }

        try {
            const result = calculateInvestmentLocally(data); 

            // 3. Exibir resultados na tela
            displayResults(result);

            // 4. Mostrar a área de resultados
            resultsArea.classList.remove('hidden');

        } catch (error) {
            console.error('Erro de simulação local:', error);
            alert(`Falha na simulação: ${error.message || 'Ocorreu um erro desconhecido no cálculo local.'}`);

        } finally {
            // Libera a UI
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Calcular Investimento';
        }
    });

    /**
     * Função para exibir os resultados na tela (RF08, RF09, RF10, RF11, RF12).
     */
    const displayResults = (result) => {
        
        // Atualizar o DOM nos Cartões (RF17)
        resultElements.grossValue.textContent = formatCurrency(result.valorBruto);
        resultElements.netValue.textContent = formatCurrency(result.valorLiquido);
        resultElements.grossProfit.textContent = formatCurrency(result.rendimentoBruto);
        resultElements.totalCosts.textContent = formatCurrency(result.custoTotal); 
        
        // Detalhamento de Custos (RF18)
        
        // IRRF (RF11)
        const irrfValue = result.impostoRenda;
        resultElements.irrfTax.textContent = formatCurrency(irrfValue);
        
        // Taxa de Custódia (RF12)
        const custodyFeeValue = result.taxaCustodia;
        resultElements.custodyFee.textContent = formatCurrency(custodyFeeValue);
        custodyFeeDetail.style.display = custodyFeeValue > 0 ? 'flex' : 'none';

        // IOF (RF11)
        const iofValue = result.iof;
        resultElements.iofTax.textContent = formatCurrency(iofValue);
        iofDetail.style.display = iofValue > 0 ? 'flex' : 'none';
        
        // Total de Custos (RF18)
        resultElements.totalCostsValue.textContent = formatCurrency(result.custoTotal);
    };

    /**
     * Função para exportar os resultados para CSV (RF13).
     */
    exportBtn.addEventListener('click', () => {
        if (resultsArea.classList.contains('hidden')) {
            alert('Realize uma simulação antes de exportar.');
            return;
        }

        // Obtém os resultados exibidos na tela
        const results = {
            'Tipo de Investimento': document.getElementById('investment-type').value,
            'Valor Inicial': document.getElementById('initial-value').value,
            'Tempo (Anos)': document.getElementById('term-years').value,
            'Taxa Anual (%)': document.getElementById('annual-rate').value,
            'Aporte Mensal (R$)': document.getElementById('monthly-contribution').value || '0',
            'Taxa Custodia (%)': document.getElementById('annual-fee').value || '0',
            'Valor Final Bruto': resultElements.grossValue.textContent,
            'Valor Final Líquido': resultElements.netValue.textContent,
            'Lucro Bruto': resultElements.grossProfit.textContent,
            'Custo Total': resultElements.totalCosts.textContent, 
            'IRRF': resultElements.irrfTax.textContent,
            'IOF': resultElements.iofTax.textContent,
            'Taxa de Custódia': resultElements.custodyFee.textContent, 
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