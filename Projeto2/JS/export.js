// Função para exportar os dados da tabela para CSV
document.getElementById("exportCsv").addEventListener("click", function() {
  var table = document.getElementById("investmentTable");
  var rows = table.rows;
  var csv = [];

  // Pega as colunas do cabeçalho
  var header = [];
  for (var i = 0; i < rows[0].cells.length; i++) {
    header.push(rows[0].cells[i].innerText);
  }
  csv.push(header.join(","));

  // Pega as linhas de dados
  for (var i = 0; i < rows.length; i++) {
    var row = [];
    for (var j = 0; j < rows[i].cells.length; j++) {
      row.push(rows[i].cells[j].innerText);
    }
    csv.push(row.join(","));
  }

  // Converte para Blob e dispara o download
  var csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
  saveAs(csvFile, "relatorio_investimentos.csv");
});
