(function() {
    const token = localStorage.getItem('token');
    // Verifica se está na página da calculadora e se não há token
    if (window.location.pathname.includes('calculadora.html') && !token) { 
        alert('Você precisa estar logado para acessar a calculadora. Redirecionando para a tela de Login.');
        // Redireciona para a página de login
        window.location.href = 'login.html'; 
    }
})();

// ===== MOCK DE TAXAS (depois podemos puxar de API) =====
const taxas = {
  selic: 10.75,
  cdi: 10.65,
  ipca: 4.25
};

// ===== LÓGICA DE HISTÓRICO (Simulação de Backend) =====

/**
 * Obtém o histórico completo do localStorage.
 */
const getHistory = () => {
    const history = localStorage.getItem('simulacoesHistorico');
    return history ? JSON.parse(history) : [];
};

/**
 * Salva o histórico completo no localStorage.
 */
const saveHistory = (history) => {
    localStorage.setItem('simulacoesHistorico', JSON.stringify(history));
};

/**
 * Salva os dados da simulação e vincula ao usuário logado.
 */
function saveSimulationToHistory(data) {
    const userId = localStorage.getItem('idUsuario');
    if (!userId) {
        alert("Você precisa estar logado para salvar o histórico.");
        return false;
    }
    
    const history = getHistory();
    const newSimulation = {
        id: Date.now(), // ID único baseado no timestamp
        idUsuario: parseInt(userId),
        dataHora: new Date().toLocaleString('pt-BR'), // Data e hora da simulação
        ...data
    };

    history.push(newSimulation);
    saveHistory(history);
    return true;
}

// ===== CÁLCULOS FINANCEIROS (IR simplificado) =====

/**
 * Calcula o Imposto de Renda (IR) com base na tabela regressiva padrão.
 */
function calcularIR(lucro, tempoMeses, tipo) {
    // LCI e LCA são isentos
    if (tipo === 'lci' || tipo === 'lca') {
        return 0;
    }

    let aliquota;
    if (tempoMeses <= 6) {
        aliquota = 22.5;
    } else if (tempoMeses <= 12) {
        aliquota = 20.0;
    } else if (tempoMeses <= 24) {
        aliquota = 17.5;
    } else {
        aliquota = 15.0; // Acima de 24 meses
    }

    return lucro * (aliquota / 100);
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

document.addEventListener('DOMContentLoaded', renderTaxas);


// ===== LÓGICA DO FORM E CÁLCULO COMPLETO (AJUSTADO PARA MESES) =====
const form = document.getElementById("form-calculadora");
const resultadoContainer = document.getElementById("resultado-container");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const valor = parseFloat(document.getElementById("valor").value);
  // MUDANÇA: O input é agora em meses
  const tempoMeses = parseInt(document.getElementById("tempo").value); 
  const rentabilidade = parseFloat(document.getElementById("rentabilidade").value);

  // NOVO: Converte meses para anos para o cálculo de juros compostos (taxa anual)
  const tempoAnos = tempoMeses / 12;

  // Cálculo (simplificado: Juros Compostos Anuais)
  // Taxa Anual = (CDI / 100) * (Rentabilidade / 100)
  const taxaAnual = (taxas.cdi / 100) * (rentabilidade / 100); 

  // M = Valor * (1 + taxaAnual)^tempoAnos
  const valorFinalBruto = valor * Math.pow((1 + taxaAnual), tempoAnos);
  
  const rendimentoBruto = valorFinalBruto - valor;

  // Cálculo do IR e IOF: usa tempoMeses para a tabela regressiva
  const impostoIR = calcularIR(rendimentoBruto, tempoMeses, tipo);
  const impostoIOF = 0; // Simplificado: assumimos que o resgate é após 30 dias
  
  const rendimentoLiquido = rendimentoBruto - impostoIR - impostoIOF;
  const valorFinalLiquido = valor + rendimentoLiquido;
  
  // Objeto de dados para salvar no histórico
  const simulationData = {
    tipo: tipo.toUpperCase(),
    valorInicial: valor,
    // Salva o tempo em anos com duas casas decimais (para a coluna "Tempo (Anos)")
    tempoAnos: tempoAnos.toFixed(2), 
    rentabilidadePercentual: rentabilidade,
    valorFinal: valorFinalLiquido, // Resultado gerado
    rendimentoLiquido: rendimentoLiquido, // Resultado gerado (Lucro Líquido)
    rendimentoBruto: rendimentoBruto, // Resultado gerado
    impostoIR: impostoIR,
    impostoIOF: impostoIOF,
  };

  // Render do resultado e passagem dos dados
  renderResultado([
    { label: "Rendimento Bruto", valor: `R$ ${rendimentoBruto.toFixed(2).replace('.', ',')}` },
    { label: "Imposto (IR)", valor: `R$ ${impostoIR.toFixed(2).replace('.', ',')}` },
    { label: "Valor Final Líquido", valor: `R$ ${valorFinalLiquido.toFixed(2).replace('.', ',')}` },
    { label: "Lucro Líquido", valor: `R$ ${rendimentoLiquido.toFixed(2).replace('.', ',')}` }
  ], simulationData); 
});


/**
 * Renderiza os cards de resultado e o botão para adicionar ao histórico.
 */
function renderResultado(dados, simulationData = null) {
  resultadoContainer.innerHTML = ""; // limpa antes

  dados.forEach((item) => {
    const card = document.createElement("div");
    card.classList.add("card-resultado");
    card.innerHTML = `
      <div class="label">${item.label}</div>
      <div class="valor">${item.valor}</div>
    `;
    resultadoContainer.appendChild(card);
  });

  // Adiciona o botão "Adicionar ao Histórico" (Requisito de Integração)
  if (simulationData && localStorage.getItem('idUsuario')) {
      const saveButton = document.createElement("button");
      saveButton.id = "addToHistory";
      saveButton.className = "btn btn-primary mt-3";
      saveButton.textContent = "Adicionar ao Histórico";
      saveButton.addEventListener("click", () => {
          if (saveSimulationToHistory(simulationData)) {
              saveButton.textContent = "Adicionado!";
              saveButton.classList.remove('btn-primary');
              saveButton.classList.add('btn-success');
              saveButton.disabled = true;
          }
      });
      resultadoContainer.appendChild(saveButton);
  }

  // scroll até o resultado com efeito suave
  resultadoContainer.scrollIntoView({ behavior: "smooth" });
}