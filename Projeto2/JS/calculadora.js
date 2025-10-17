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

// ===== RENDERIZAÇÃO DOS CARDS DE TAXA =====
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

renderTaxas();

// ===== LÓGICA DO FORM E CÁLCULO SIMPLES =====
const form = document.getElementById("form-calculadora");
const resultadoContainer = document.getElementById("resultado-container");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const tempo = parseInt(document.getElementById("tempo").value);
  const rentabilidade = parseFloat(document.getElementById("rentabilidade").value);

  // Placeholder de cálculo — depois aplicamos IR, IOF, isenção real
  const cdiHoje = taxas.cdi / 100;
  const rendimentoBruto = valor * (1 + (cdiHoje * (rentabilidade / 100))) ** (tempo / 12);
  const lucro = rendimentoBruto - valor;

  // IR provisório — depois aplicamos tabela progressiva conforme meses
  let ir = 0;
  if (tipo === "cdb" || tipo === "tesouro") {
    ir = lucro * 0.15; // 15% fixo como placeholder
  } else {
    ir = 0; // LCI/LCA isento
  }

  const rendimentoLiquido = lucro - ir;

  // Render do resultado
  renderResultado([
    { label: "Rendimento Bruto", valor: `R$ ${lucro.toFixed(2)}` },
    { label: "Imposto (IR/IOF)", valor: `R$ ${ir.toFixed(2)}` },
    { label: "Valor Final", valor: `R$ ${rendimentoBruto.toFixed(2)}` },
    { label: "Rendimento Líquido", valor: `R$ ${rendimentoLiquido.toFixed(2)}` }
  ]);
});

function renderResultado(dados) {
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

  // scroll até o resultado com efeito suave
  resultadoContainer.scrollIntoView({ behavior: "smooth" });
}
