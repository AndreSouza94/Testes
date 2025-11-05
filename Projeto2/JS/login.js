// Referências aos elementos
const cardFlip = document.getElementById("cardFlip");
const toRegister = document.getElementById("toRegister");
const toLogin = document.getElementById("toLogin");

// Alterna entre os formulários de login e cadastro
toRegister.addEventListener("click", (e) => {
    e.preventDefault();
    cardFlip.classList.add("flip");
});

toLogin.addEventListener("click", (e) => {
    e.preventDefault();
    cardFlip.classList.remove("flip");
});

// --- Funções de Simulação de Backend (Armazenamento Local) ---

/**
 * Obtém a lista de usuários armazenada localmente.
 * @returns {Array} Array de objetos de usuário.
 */
const getLocalUsers = () => {
    const users = localStorage.getItem('localUsers');
    return users ? JSON.parse(users) : [];
};

/**
 * Salva a lista atualizada de usuários localmente.
 * @param {Array} users - Array de objetos de usuário.
 */
const saveLocalUsers = (users) => {
    localStorage.setItem('localUsers', JSON.stringify(users));
};

/**
 * Simula o registro de um novo usuário localmente.
 */
const localRegister = (payload) => {
    const users = getLocalUsers();

    // 1. Verifica se o e-mail já está em uso
    if (users.some(user => user.Email === payload.Email)) {
        return { success: false, message: "Este e-mail já está cadastrado." };
    }

    // 2. Cria e armazena o novo usuário
    const newUserId = Math.floor(Math.random() * 100000) + 1;
    const newUser = {
        idUsuario: newUserId,
        Nome: payload.Nome,
        Email: payload.Email,
        Senha: payload.Senha,
        isAdm: false 
    };

    users.push(newUser);
    saveLocalUsers(users);

    return { success: true, message: "Cadastro realizado com sucesso." };
};

/**
 * Simula o login de um usuário localmente.
 */
const localLogin = (payload) => {
    const users = getLocalUsers();

    // 1. Encontra o usuário pelo e-mail e senha
    const user = users.find(u => u.Email === payload.Email && u.Senha === payload.Senha);

    if (user) {
        // 2. Retorna dados de sucesso (simulando token)
        const token = `local_token_${Math.random().toString(36).substring(2)}`;
        return {
            success: true,
            message: "Autenticação realizada com sucesso.",
            token: token,
            idUsuario: user.idUsuario,
            Nome: user.Nome, 
            isAdm: user.isAdm 
        };
    } else {
        return { success: false, message: "Login inválido. Verifique suas credenciais." };
    }
};

// --- Função de login (Utilizando simulação local) ---
document.querySelector(".form-side form").addEventListener("submit", function(e) {
    e.preventDefault();

    // Pegando os dados do formulário de login
    const loginEmail = document.getElementById("loginEmail").value.trim();
    const loginSenha = document.getElementById("loginSenha").value.trim();

    if (!loginEmail || !loginSenha) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const payload = {
        Email: loginEmail,
        Senha: loginSenha
    };

    // Chamada à função de login local
    const data = localLogin(payload);
    
    if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("idUsuario", data.idUsuario);
        localStorage.setItem("userName", data.Nome); 
        
        // Redireciona para o index.html, que é sua página principal.
        window.location.href = "index.html"; 
    } else {
        alert(data.message); 
    }
});

// --- Função de cadastro (Utilizando simulação local) ---
// Note que agora selecionamos pelo ID do formulário para evitar conflitos
document.querySelector(".form-back form").addEventListener("submit", function(e) {
    e.preventDefault();

    // Pegando os dados do formulário de cadastro
    const nome = document.getElementById("nome").value.trim();
    const cadEmail = document.getElementById("cadEmail").value.trim();
    const cadSenha = document.getElementById("cadSenha").value.trim();
    const confirmaSenha = document.getElementById("confirmaSenha").value.trim(); // NOVO CAMPO

    if (!nome || !cadEmail || !cadSenha || !confirmaSenha) {
        alert("Todos os campos são obrigatórios.");
        return;
    }

    // 1. VALIDAÇÃO DE CONFIRMAÇÃO DE SENHA (Novo requisito)
    if (cadSenha !== confirmaSenha) {
        alert("As senhas digitadas não coincidem.");
        return;
    }

    // 2. Validação do e-mail
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(cadEmail)) {
        alert("Email inválido. Por favor, insira um email válido.");
        return;
    }

    // 3. Validação da senha
    if (cadSenha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    const payload = {
        Nome: nome,
        Email: cadEmail,
        // Envia apenas a senha principal para o registro
        Senha: cadSenha
    };

    // Chamada à função de cadastro local
    const data = localRegister(payload);
    
    if (data.success) {
        alert("Cadastro realizado com sucesso! Faça seu login.");
        // Após o cadastro, volta para a tela de login
        cardFlip.classList.remove("flip"); 
    } else {
        alert(data.message); 
    }
});