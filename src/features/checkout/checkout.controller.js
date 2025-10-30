// src/features/checkout/checkout.controller.js
const checkoutService = require('./checkout.service');

class CheckoutController {
    async createPayment(req, res) {
        try {
            // Os dados virão do frontend
            const clientData = req.body; 
            
            // Validação básica dos dados recebidos
            if (!clientData.planType || !clientData.clientEmail || !clientData.formData) {
                return res.status(400).json({ error: 'Dados incompletos para criar o pagamento.' });
            }

            const checkout = await checkoutService.createPaymentCheckout(clientData);
            res.status(200).json(checkout);

        } catch (error) {
            console.error('[Controller] Erro ao criar checkout:', error);
            res.status(500).json({ error: 'Falha ao criar o checkout de pagamento.' });
        }
    }
}

module.exports = new CheckoutController();