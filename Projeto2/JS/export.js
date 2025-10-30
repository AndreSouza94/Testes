
document.getElementById("exportCsv").addEventListener("click", function() {
  const table = document.querySelector(".table-dark"); // Seleciona a tabela principal
  const rows = table.querySelectorAll('tbody tr');
  const headerCells = table.querySelectorAll('thead th');
  let csv = [];

  // 1. Pega as colunas do cabeçalho, ignorando a primeira (Checkbox)
  let header = [];
  for (let i = 1; i < headerCells.length; i++) {
    header.push(`"${headerCells[i].innerText.trim()}"`);
  }
  // Usa ponto e vírgula como separador para CSV pt-BR
  csv.push(header.join(";")); 

  // 2. Pega as linhas de dados, ignorando a primeira célula (Checkbox)
  rows.forEach(row => {
    // Ignora linhas de mensagem (ex: "Nenhuma simulação...")
    if (row.cells.length <= 1) return; 

    let rowData = [];
    for (let j = 1; j < row.cells.length; j++) {
        let cellText = row.cells[j].innerText.trim();
        
        // Remove 'R$' ou '%' e substitui vírgula por ponto para formato numérico
        cellText = cellText.replace('R$', '').replace('%', '').trim();
        
        // Trata a conversão de formato de moeda brasileiro (vírgula decimal)
        // Substitui o ponto (separador de milhar) por nada e a vírgula (separador decimal) por ponto
        // Ex: "10.000,50" -> "10000.50"
        cellText = cellText.split('.').join('').replace(',', '.'); 
        
        // Coloca aspas em torno do valor (necessário para Data e Hora, e protege números)
        rowData.push(`"${cellText}"`);
    }
    csv.push(rowData.join(";"));
  });

  // 3. Converte para Blob e dispara o download (Requisito: Exportar CSV funcional)
  var csvString = csv.join("\n");
  var csvFile = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  var filename = "historico_simulacoes.csv";

  // Implementação nativa para download
  var link = document.createElement("a");
  if (link.download !== undefined) { 
      var url = URL.createObjectURL(csvFile);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }
});