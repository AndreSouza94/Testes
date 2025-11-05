// frontend/JS/recuperar-senha.js - Contém a lógica da página e o MOCK da API

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("recoverForm");
    const emailInput = document.getElementById("recoveryEmail");
    const statusDiv = document.getElementById("statusMessage");
    const sendBtn = document.getElementById("sendRecoveryBtn");

    /**
     * MOCK do Endpoint /api/auth/forgot-password (Simula a resposta do Backend Node.js)
     * Quando a integração for retomada, você APENAS substituirá esta função 
     * pela chamada real do Axios para o seu servidor.
     */
    const forgotPasswordMock = async (email) => {
        // Simula a latência da rede
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        // --- Simulação das Mensagens do SEU Backend ---
        if (email.includes('success@')) {
            // Sucesso (status 200 no Node.js)
            return {
                status: 'success',
                message: 'Token de recuperação enviado para o seu e-mail!'
            };
        } else if (email.includes('notfound@')) {
            // Erro 404 (usuário não encontrado)
            throw new Error("Não há usuário com este e-mail."); 
        } else {
            // Erro 500 (falha no envio do e-mail, por exemplo)
            throw new Error("Houve um erro ao enviar o e-mail. Tente novamente mais tarde.");
        }
    };

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

    // Evento de Submissão do Formulário
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearStatus();

        const email = emailInput.value.trim();

        if (!email) {
            displayStatus("O campo de e-mail é obrigatório.", false);
            return;
        }

        // 1. Bloqueia a UI
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        try {
            // 2. Chama a função MOCK
            const result = await forgotPasswordMock(email);

            // 3. Sucesso: exibe a mensagem retornada pelo MOCK
            displayStatus(result.message, true);
            emailInput.value = '';

        } catch (error) {
            // 4. Erro: exibe a mensagem de erro lançada pelo MOCK
            const userMessage = error.message || 'Erro desconhecido. Tente novamente.';
            displayStatus(userMessage, false);

        } finally {
            // 5. Libera a UI
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Enviar Instruções';
        }
    });
});