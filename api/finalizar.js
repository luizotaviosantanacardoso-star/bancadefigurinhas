export default async function handler(req, res) {
    // Permite apenas requisições do tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    try {
        const { nome, cpf, email, total } = req.body;

        // Validação básica para garantir que nenhum campo chegue vazio
        if (!nome || !cpf || !email || !total) {
            return res.status(400).json({ message: 'Dados incompletos ou inválidos.' });
        }

        // Sanitização dos dados recebidos do front-end
        const nomeLimpo = nome.trim();
        const cpfLimpo = cpf.replace(/\D/g, ''); // Garante o envio apenas de números
        const emailLimpo = email.trim();
        const valorCentavos = Math.round(parseFloat(total) * 100); // Converte para o padrão de centavos (ex: 5.80 vira 580)

        // Configuração da requisição para a API do gateway de pagamento
        // Substitua a URL abaixo pelo endpoint oficial do provedor utilizado
        const urlGateway = 'https://api.cakto.com.br/v1/transactions'; 

        const response = await fetch(urlGateway, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CAKTO_API_KEY}`
            },
            body: JSON.stringify({
                payment_method: 'pix',
                amount: valorCentavos,
                customer: {
                    name: nomeLimpo,
                    document: cpfLimpo,
                    email: emailLimpo
                },
                items: [
                    {
                        title: "Pedido Figurinhas 2026",
                        unit_price: valorCentavos,
                        quantity: 1
                    }
                ]
            })
        });

        const data = await response.json();

        // Se o gateway retornar algum erro de validação (ex: credenciais ou regras de negócio)
        if (!response.ok) {
            console.error("Resposta de erro do gateway:", data);
            return res.status(response.status).json(data);
        }

        // Retorna a resposta de sucesso com os dados do Pix para o front-end
        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro interno no processamento:", error.message);
        return res.status(500).json({ message: "Erro interno ao processar a requisição." });
    }
}