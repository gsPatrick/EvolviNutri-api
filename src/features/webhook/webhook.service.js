// src/features/webhook/webhook.service.js
const axios = require('axios');
const DietRequest = require('../../models/dietRequest.model');
const openai = require('../../config/openai');
const resend = require('../../config/resend');
const mercadopago = require('../../config/mercadopago');

//
// ▼▼▼ O PROMPT FOI ATUALIZADO AQUI ▼▼▼
//
const PROMPT_MASTER = `
Você é um nutricionista especialista em dietas personalizadas. Sua tarefa é analisar detalhadamente todas as informações fornecidas no formulário e nos cálculos prévios do usuário.

Essas informações incluem:
- Dados pessoais (gênero, idade, peso, altura)
- Taxa Metabólica Basal (TMB) e Gasto Energético Total (TDEE) calculados
- Objetivo principal (perda de gordura, manutenção ou ganho de massa)
- Nível de atividade física, histórico clínico, alergias e intolerâncias
- Preferências alimentares (alimentos que gosta e não gosta)
- Rotina de horários e número de refeições desejado

Com base nesses dados, siga estas etapas OBRIGATORIAMENTE:

1.  **RESUMO NUMÉRICO INICIAL:** Comece a resposta com um resumo claro e conciso das metas diárias totais. Este resumo DEVE incluir:
    *   **Calorias Totais:** O total de kcal do plano.
    *   **Proteínas:** O total em gramas.
    *   **Carboidratos:** O total em gramas.
    *   **Gorduras:** O total em gramas.
    Apresente isso de forma destacada usando emojis.

2.  **CARDÁPIO DIÁRIO:** Após o resumo, monte um cardápio diário detalhado e personalizado, dividido por refeições (Café da Manhã, Almoço, Lanche da Tarde, Jantar, Ceia). Para cada refeição, especifique os alimentos, as quantidades em gramas ou unidades, e o modo de preparo de forma clara e objetiva.

3.  **LISTA DE COMPRAS E MENSAGEM:** Finalize com uma breve lista de compras e uma mensagem motivacional.

O texto final deve ser formatado para ser perfeitamente legível no WhatsApp, usando quebras de linha, negrito e emojis de forma inteligente para organizar a informação.
`;

class WebhookService {
    
    /**
     * Método principal que é chamado pelo controller.
     * Processa a notificação de pagamento recebida do Mercado Pago.
     * @param {object} webhookData - O corpo da notificação do webhook.
     */
    async processPayment(webhookData) {
        // A notificação do tipo 'payment' contém o ID do pagamento.
        const paymentId = webhookData.data?.id;
        
        if (!paymentId || webhookData.type !== 'payment') {
            console.log("Webhook recebido, mas não é uma notificação de pagamento válida. Ignorando.");
            return;
        }

        try {
            // 1. Busca os detalhes completos do pagamento na API do Mercado Pago
            const paymentInfo = await mercadopago.payment.findById(paymentId);
            const paymentStatus = paymentInfo.body.status;
            const requestId = paymentInfo.body.external_reference;

            // 2. Se o pagamento não foi aprovado, não fazemos nada.
            if (paymentStatus !== 'approved') {
                console.log(`Pagamento ${paymentId} não está aprovado (status: ${paymentStatus}). Ignorando.`);
                return;
            }

            // 3. Encontra a requisição no nosso banco de dados usando o ID (external_reference)
            const request = await DietRequest.findByPk(requestId);
            if (!request) {
                console.error(`[Service] CRÍTICO: Requisição com ID ${requestId} (do pagamento ${paymentId}) não encontrada no banco de dados.`);
                return;
            }

            // 4. Se o pagamento já foi processado (idempotência), não faz nada.
            if (request.status !== 'pending_payment') {
                console.log(`Requisição ${requestId} já foi processada. Status atual: ${request.status}. Ignorando webhook duplicado.`);
                return;
            }

            // 5. Atualiza o status para indicar que o pagamento foi recebido com sucesso
            await request.update({ status: 'payment_received' });
            console.log(`Pagamento para a requisição ${requestId} aprovado. Iniciando processamento do plano.`);

            // 6. Decide o fluxo com base no tipo de plano comprado
            if (request.planType === 'basic') {
                await this.handleBasicPlan(request);
            } else if (request.planType === 'premium') {
                await this.handlePremiumPlan(request);
            }

        } catch (error) {
            console.error(`[Service] Falha grave ao processar o webhook para o pagamento ${paymentId}:`, error.message);
        }
    }

    /**
     * Orquestra o fluxo para o Plano Básico (automatizado).
     * @param {object} request - A instância do modelo DietRequest.
     */
    async handleBasicPlan(request) {
        try {
            await request.update({ status: 'generating_plan' });

            const generatedPlan = await this._generatePlanWithGPT(request.formData);
            if (!generatedPlan) throw new Error("A IA não retornou um plano.");
            
            await request.update({ generatedPlan });
            
            await this._sendPlanViaWhatsApp(request.clientWhatsapp, generatedPlan);
            await this._sendPlanViaEmail(request.clientEmail, request.clientName, generatedPlan);

            await request.update({ status: 'plan_sent' });
            console.log(`Plano Básico para ${request.clientEmail} (Req ID: ${request.id}) processado e enviado com sucesso.`);

        } catch (error) {
            await request.update({ status: 'error' });
            console.error(`[Service] Erro ao lidar com o Plano Básico para a requisição ${request.id}:`, error.message);
        }
    }

    /**
     * Orquestra o fluxo para o Plano Premium (notificação manual).
     * @param {object} request - A instância do modelo DietRequest.
     */
    async handlePremiumPlan(request) {
        try {
            await this._sendAdminNotification(request.formData);

            const confirmationMessage = `Olá, ${request.clientName}! ✅ Recebemos sua solicitação do Plano Premium. Um de nossos especialistas analisará seu formulário e entrará em contato em até 24h para iniciar sua consultoria personalizada. Bem-vindo(a) à Evolvi Nutri!`;
            await this._sendPlanViaWhatsApp(request.clientWhatsapp, confirmationMessage);

            await request.update({ status: 'awaiting_manual_review' });
            console.log(`Plano Premium para ${request.clientEmail} (Req ID: ${request.id}) recebido. Notificação enviada para o admin.`);
        } catch (error) {
            await request.update({ status: 'error' });
            console.error(`[Service] Erro ao lidar com o Plano Premium para a requisição ${request.id}:`, error.message);
        }
    }

    // --- MÉTODOS PRIVADOS DE INTEGRAÇÃO ---

    async _generatePlanWithGPT(formData) {
        try {
            console.log("Iniciando geração de plano com a OpenAI...");
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    { role: "system", content: PROMPT_MASTER },
                    { role: "user", content: `Aqui estão os dados do cliente: ${JSON.stringify(formData, null, 2)}` }
                ],
                temperature: 0.7,
            });
            
            const content = response.choices[0].message.content;
            console.log("Plano gerado com sucesso pela OpenAI.");
            return content;

        } catch (error) {
            console.error("Erro na API da OpenAI:", error.response ? error.response.data : error.message);
            throw new Error("Falha ao gerar o plano com a IA.");
        }
    }

    async _sendPlanViaWhatsApp(phoneNumber, message) {
        try {
            const formattedPhone = `55${phoneNumber.replace(/\D/g, '')}`;
            console.log(`Enviando mensagem para o WhatsApp ${formattedPhone}...`);
            
            const ZAPI_URL = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`;
            
            await axios.post(ZAPI_URL, {
                phone: formattedPhone,
                message: message
            }, {
                headers: {
                    'Client-Token': process.env.ZAPI_CLIENT_TOKEN
                }
            });

            console.log("Mensagem enviada com sucesso via Z-API.");

        } catch (error) {
            console.error("Erro na API da Z-API:", error.response ? error.response.data : error.message);
            throw new Error("Falha ao enviar mensagem via WhatsApp.");
        }
    }

    async _sendPlanViaEmail(toEmail, toName, plan) {
        try {
            console.log(`Enviando e-mail (Básico) para ${toEmail}...`);
            await resend.emails.send({
                from: 'Evolvi Nutri <contato@evolvinutri.com.br>',
                to: [toEmail],
                subject: 'Seu Plano Alimentar Personalizado está Pronto! 🥗',
                html: `<h1>Olá, ${toName}!</h1><p>Aqui está o seu plano gerado por nossa IA. Bons treinos e boa dieta!</p><div style="white-space: pre-wrap; background-color: #f4f4f4; padding: 15px; border-radius: 5px;">${plan}</div>`
            });
            console.log("E-mail do plano básico enviado com sucesso.");

        } catch (error) {
            console.error("Erro na API do Resend (Plano Básico):", error.message);
            throw new Error("Falha ao enviar e-mail com o plano.");
        }
    }

    async _sendAdminNotification(formData) {
        try {
            console.log(`Enviando e-mail (Premium) para o admin ${process.env.ADMIN_EMAIL}...`);
            await resend.emails.send({
                from: 'Alerta de Novo Cliente Premium <alerta@evolvinutri.com.br>',
                to: [process.env.ADMIN_EMAIL],
                subject: `🚀 Novo Cliente Premium - ${formData.clientName}`,
                html: `<h1>Novo Cliente Premium</h1><p>Um novo cliente contratou o plano premium. Por favor, analise os dados abaixo e entre em contato:</p><pre style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">${JSON.stringify(formData, null, 2)}</pre>`
            });
            console.log("E-mail de notificação para o admin enviado com sucesso.");
            
        } catch (error) {
            console.error("Erro na API do Resend (Notificação Admin):", error.message);
            throw new Error("Falha ao enviar e-mail de notificação para o admin.");
        }
    }
}

module.exports = new WebhookService();