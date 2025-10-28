document.addEventListener('DOMContentLoaded', () => {
    // Seleciona todos os botões que são os cabeçalhos das perguntas
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            
            // 1. Lógica para fechar todos os outros acordeões abertos (opcional, mas recomendado para UX)
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== header && otherHeader.classList.contains('active')) {
                    otherHeader.classList.remove('active');
                    const otherContent = otherHeader.nextElementSibling;
                    otherContent.style.maxHeight = null;
                    otherContent.style.padding = '0 20px'; // Ajusta o padding para fechar
                }
            });

            // 2. Alterna o estado (classe 'active') do acordeão clicado
            header.classList.toggle('active');

            // 3. Seleciona o conteúdo da resposta, que é o elemento seguinte (nextElementSibling)
            const content = header.nextElementSibling; 

            // 4. Aplica a animação de abrir ou fechar
            if (content.style.maxHeight) {
                // Se o maxHeight tiver um valor (estiver aberto), fecha
                content.style.maxHeight = null;
                content.style.padding = '0 20px'; // Ajusta o padding para fechar
            } else {
                // Se estiver fechado, abre. 
                // Usa scrollHeight para descobrir a altura exata do conteúdo e aplica o padding
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.padding = '0 20px 15px 20px'; // Aplica o padding vertical e horizontal
            }
        });
    });
});