// src/features/webhook/webhook.controller.js
const webhookService = require('./webhook.service');

class WebhookController {
    async handlePayment(req, res) {
        try {
            // Aqui viria a validação do webhook do Mercado Pago para segurança
            const paymentData = req.body;
            
            // Simplesmente passamos os dados para o serviço processar
            // A resposta ao webhook deve ser rápida, por isso o serviço lida com a lógica de forma assíncrona
            webhookService.processPayment(paymentData);

            // Responde imediatamente ao Mercado Pago para evitar timeouts
            res.status(200).json({ message: 'Webhook received successfully.' });

        } catch (error) {
            console.error('[Controller] Error handling webhook:', error);
            // Mesmo em caso de erro, é comum responder 200 para o webhook não tentar reenviar indefinidamente
            res.status(200).json({ message: 'Webhook received but failed to process internally.' });
        }
    }
}

module.exports = new WebhookController();