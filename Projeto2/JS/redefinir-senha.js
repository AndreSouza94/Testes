// frontend/JS/redefinir-senha.js - Lógica para redefinir a senha (Integração Real)

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetForm");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const statusDiv = document.getElementById("statusMessage");
    const resetBtn = document.getElementById("resetPasswordBtn");

    
    const API_BASE_URL = 'http://localhost:3000'; 

    // 1. EXTRAI O TOKEN DA URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        displayStatus("Token de redefinição não encontrado na URL. Solicite um novo link.", false);
        resetBtn.disabled = true;
    }
    
    /**
     * Exibe uma mensagem de status na tela.
     */
    const displayStatus = (message, isSuccess = true) => {
        statusDiv.textContent = message;
        statusDiv.className = 'mt-3 text-center ' + (isSuccess ? 'success-message' : 'error-message');
    };

    /**
     * Função REAL de Redefinição de Senha.
     * Envia o token e a nova senha para o endpoint do Backend.
     */
    const resetPasswordIntegration = async (token, password) => {
        // O endpoint deve incluir o token como parâmetro de URL
        const endpoint = `${API_BASE_URL}/api/auth/resetPassword/${token}`; 
        
        try {
            // Chamada Axios REAL: PATCH para enviar a nova senha
            const response = await axios.patch(endpoint, { password });

            // O Backend deve retornar 200 e a mensagem/token de sucesso no response.data
            return response.data;
            
        } catch (error) {
            // Tratamento de erros (Ex: 400 - Token inválido/expirado)
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


    // Evento de Submissão do Formulário
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        displayStatus(""); 

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // 1. Validação de Senha (mínimo de 6 caracteres - ajuste se o backend for diferente)
        if (newPassword.length < 6) { 
             displayStatus("A nova senha deve ter pelo menos 6 caracteres.", false);
             return;
        }

        // 2. Validação de Confirmação de Senha
        if (newPassword !== confirmPassword) {
            displayStatus("As senhas não coincidem. Verifique a digitação.", false);
            return;
        }

        // 3. Validação do Token
        if (!token) {
             displayStatus("Erro: O token de segurança está ausente.", false);
             return;
        }
        
        // 4. Bloqueia a UI e mostra o spinner
        resetBtn.disabled = true;
        resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redefinindo...';
        
        try {
            // 5. Chama a função de integração REAL
            const result = await resetPasswordIntegration(token, newPassword);

            // 6. Sucesso: exibe mensagem e redireciona (o backend retorna o token)
            displayStatus('Senha redefinida com sucesso! Você será redirecionado para o Login.', true);
            
            // O Backend retorna um novo token de login após a redefinição: salve-o!
            if (result.token) {
                 localStorage.setItem('token', result.token);
                 // Você pode adicionar a lógica de salvar outros dados do usuário aqui
            }

            // Redireciona para o login após 3 segundos
            setTimeout(() => {
                window.location.href = 'login.html'; 
            }, 3000); 

        } catch (error) {
            // 7. Erro: exibe a mensagem de erro
            displayStatus(error.message, false);
            
        } finally {
            // 8. Libera o botão (se não houve redirecionamento)
            resetBtn.disabled = false;
            resetBtn.innerHTML = 'Redefinir Senha';
        }
    });
});