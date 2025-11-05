// frontend/JS/recuperar-senha.js - Lógica para solicitar o e-mail de recuperação (Integração Real)

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("recoverForm");
    const emailInput = document.getElementById("recoveryEmail");
    const statusDiv = document.getElementById("statusMessage");
    const sendBtn = document.getElementById("sendRecoveryBtn");

    
    const API_BASE_URL = 'http://localhost:3000'; 

    /**
     * Exibe uma mensagem de status na tela.
     */
    const displayStatus = (message, isSuccess = true) => {
        statusDiv.textContent = message;
        statusDiv.className = 'mt-3 text-center ' + (isSuccess ? 'success-message' : 'error-message');
    };
    
    /**
     * Limpa a mensagem de status.
     */
    const clearStatus = () => {
        statusDiv.textContent = '';
        statusDiv.className = 'mt-3 text-center';
    };

    /**
     * Função REAL de Recuperação de Senha.
     * Envia o e-mail para o endpoint do Backend.
     */
    const forgotPasswordIntegration = async (email) => {
        const endpoint = `${API_BASE_URL}/api/auth/forgot-password`;
        
        try {
            // Chamada Axios REAL: POST para enviar o email
            const response = await axios.post(endpoint, { email });

            // O Backend deve retornar 200/201 e a mensagem de sucesso no response.data
            return response.data;
            
        } catch (error) {
            // Tratamento de erros (Ex: 404 - Email não encontrado, 500 - Erro de envio de email)
            let errorMessage = "Erro de conexão ou servidor desconhecido.";

            if (error.response) {
                // Erro HTTP: usa a mensagem de erro do Backend
                errorMessage = error.response.data.message || `Erro do servidor: Status ${error.response.status}`;
            } else if (error.request) {
                // Erro de rede: servidor não respondeu
                errorMessage = "Falha de rede. Verifique se o Backend Node.js está ativo.";
            }

            // Lança o erro para ser pego pelo catch no event listener
            throw new Error(errorMessage);
        }
    };


    // Evento de Submissão do Formulário (Async/Await)
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearStatus();

        const email = emailInput.value.trim();

        if (!email) {
            displayStatus("O campo de e-mail é obrigatório.", false);
            return;
        }

        // 1. Bloqueia a UI e mostra o spinner
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        try {
            // 2. Chama a função de integração REAL
            const result = await forgotPasswordIntegration(email);

            // 3. Sucesso: exibe a mensagem retornada pelo Backend
            displayStatus(result.message, true);
            emailInput.value = '';

        } catch (error) {
            // 4. Erro: exibe a mensagem de erro lançada pela integração
            displayStatus(error.message, false);
        } finally {
            // 5. Libera o botão
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Enviar Instruções';
        }
    });
});