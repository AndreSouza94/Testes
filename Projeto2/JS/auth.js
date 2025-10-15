function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('idUsuario');
    localStorage.removeItem('userName'); 
    // Redireciona para a página principal para atualizar o cabeçalho
    window.location.href = 'index.html'; 
}

// Função para atualizar o cabeçalho dinamicamente
function updateHeaderUI() {
    const userName = localStorage.getItem('userName');
    const token = localStorage.getItem('token');
    const headerActions = document.querySelector('header .header-actions'); 
    
    if (!headerActions) return;

    headerActions.innerHTML = ''; // Limpa as ações existentes

    if (token && userName) {
        
        
        // Exibe "Olá, Nome" (primeiro nome)
        const welcomeSpan = document.createElement('span');
        welcomeSpan.className = 'acesso-link logged-in-user'; 
        welcomeSpan.textContent = `Olá, ${userName.split(' ')[0]}`;

        // Botão/Link de Logout (Estilo Bootstrap via CSS customizado)
        const logoutLink = document.createElement('a');
        logoutLink.className = 'btn-header'; 
        logoutLink.href = '#';
        logoutLink.textContent = 'Sair';
        logoutLink.addEventListener('click', handleLogout);

        headerActions.appendChild(welcomeSpan);
        headerActions.appendChild(logoutLink);
    } else {
        // Usuário Não Logado: Exibe link de Acesso
        const acessoLink = document.createElement('a');
        const calcularLink = document.createElement('a');
        calcularLink.className = 'btn-header';
        calcularLink.href = 'login.html';
        calcularLink.textContent = 'Acesso';

        headerActions.appendChild(acessoLink);
        headerActions.appendChild(calcularLink);
    }
}

document.addEventListener('DOMContentLoaded', updateHeaderUI);