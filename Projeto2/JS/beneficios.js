document.addEventListener("DOMContentLoaded", () => {
  // Simulação de dados que podem vir de API ou cálculo
  const valorInvestido = 10000;
  const rentabilidadeAnual = 0.085; // 8,5%
  const retorno = valorInvestido * rentabilidadeAnual;

  // Formatação
  function formatarValorBr(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function formatarPercentual(valor) {
    return (valor * 100).toFixed(2) + "%";
  }

  // Inserir nos elementos da página
  document.getElementById("valor-investido").textContent = formatarValorBr(valorInvestido);
  document.getElementById("rentabilidade").textContent = formatarPercentual(rentabilidadeAnual);
  document.getElementById("retorno").textContent = formatarValorBr(retorno);
});
