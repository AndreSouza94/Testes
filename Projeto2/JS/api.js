// assets/js/api.js

// ***************************************************************
// IMPORTANTE: Mude esta URL para o endereço do seu Backend Node.js
// ***************************************************************
const API_BASE_URL = 'http://localhost:3000'; 

/**
 * Envia os dados do investimento para o Backend Node.js para cálculo.
 * O servidor deve retornar um objeto com os resultados calculados, 
 * incluindo valorBruto, valorLiquido, rendimentoBruto, impostoRenda, iof e taxas.
 * * @param {object} data - Os dados de input do formulário.
 * @returns {Promise<object>} Um objeto com os resultados calculados pelo servidor.
 * @throws {Error} Se a requisição falhar.
 */
const calculateInvestment = async (data) => {
    const endpoint = `${API_BASE_URL}/api/calculate`; 

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        // Verifica o status HTTP
        if (!response.ok) {
            let errorMessage = `Erro do servidor: Status ${response.status}`;
            
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorMessage;
            } catch (e) {
                // Não é JSON, usa a mensagem HTTP padrão
            }
            throw new Error(errorMessage);
        }

        // Retorna os dados JSON (resultado do cálculo)
        const result = await response.json();
        
        // Validação mínima dos dados
        if (typeof result.valorBruto !== 'number' || typeof result.valorLiquido !== 'number') {
             throw new Error("O servidor retornou um formato de resultado inválido.");
        }
        
        return result;

    } catch (error) {
        // Re-lança o erro para ser capturado no main.js
        throw error;
    }
};