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

// Função de login
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

    fetch('URL', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === "Autenticação realizada com sucesso.") {
            localStorage.setItem("token", data.token);
            localStorage.setItem("idUsuario", data.idUsuario);
            window.location.href = data.isAdm ? "admin.html" : "home.html";
        } else {
            alert("Login inválido. Verifique suas credenciais.");
        }
    })
    .catch(err => {
        console.error("Erro ao conectar com o servidor:", err.message);
        alert("Erro ao conectar com o servidor.");
    });
});

// Função de cadastro
document.querySelector(".form-back form").addEventListener("submit", function(e) {
    e.preventDefault();

    // Pegando os dados do formulário de cadastro
    const nome = document.getElementById("nome").value.trim();
    const cadEmail = document.getElementById("cadEmail").value.trim();
    const cadSenha = document.getElementById("cadSenha").value.trim();

    if (!nome || !cadEmail || !cadSenha) {
        alert("Todos os campos são obrigatórios.");
        return;
    }

    // Validação do e-mail
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(cadEmail)) {
        alert("Email inválido. Por favor, insira um email válido.");
        return;
    }

    // Validação da senha
    if (cadSenha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    const payload = {
        Nome: nome,
        Email: cadEmail,
        Senha: cadSenha
    };

    fetch('URL', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === "Cadastro realizado com sucesso.") {
            alert("Cadastro realizado com sucesso!");
            window.location.href = "index.html"; // Redireciona para a página de login
        } else {
            alert("Erro ao cadastrar. Tente novamente.");
        }
    })
    .catch(err => {
        console.error("Erro ao conectar com o servidor:", err.message);
        alert("Erro ao conectar com o servidor.");
    });
});
