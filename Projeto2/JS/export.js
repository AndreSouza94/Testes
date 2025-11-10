document.getElementById("exportCsv").addEventListener("click", function() {
  const table = document.querySelector(".table-dark"); // Seleciona a tabela principal
  const rows = table.querySelectorAll('tbody tr');
  const headerCells = table.querySelectorAll('thead th');
  let csv = [];

  const COLUMNS_COUNT = headerCells.length; // Será 13 (1 checkbox + 12 dados)

  // 1. Pega as colunas do cabeçalho, ignorando a primeira (Checkbox)
  let header = [];
  // Itera de 1 até o final para pegar todos os cabeçalhos de dados (12 colunas)
  for (let i = 1; i < COLUMNS_COUNT; i++) {
    header.push(`"${headerCells[i].innerText.trim()}"`);
  }
  // Usa ponto e vírgula como separador para CSV pt-BR
  csv.push(header.join(";")); 

  // 2. Pega as linhas de dados, ignorando a primeira célula (Checkbox)
  rows.forEach(row => {
    // Ignora linhas de mensagem (colspan)
    if (row.cells.length < COLUMNS_COUNT) return; 

    let rowData = [];
    // Itera da coluna 1 (Data e Hora) até a última coluna de dados (12 colunas de dados)
    for (let j = 1; j < COLUMNS_COUNT; j++) {
        let cellText = row.cells[j].innerText.trim();
        
        // Limpa 'R$' ou '%', remove pontos de milhar, troca vírgula decimal por ponto.
        cellText = cellText.replace('R$', '').replace('%', '').trim();
        cellText = cellText.split('.').join('').replace(',', '.'); 
        
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