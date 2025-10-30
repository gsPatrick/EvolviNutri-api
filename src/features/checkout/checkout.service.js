// src/features/checkout/checkout.service.js
const mercadopago = require('../../config/mercadopago'); // Usaremos a configuração centralizada
const DietRequest = require('../../models/dietRequest.model');

const PLAN_PRICES = {
    basic: 97.00,
    premium: 197.00
};

class CheckoutService {

    async createPaymentCheckout(clientData) {
        const { planType, clientName, clientEmail, clientWhatsapp, formData } = clientData;

        if (!PLAN_PRICES[planType]) {
            throw new Error('Plano inválido selecionado.');
        }

        // 1. Salva a requisição no banco ANTES de gerar o link de pagamento
        const newRequest = await DietRequest.create({
            clientName,
            clientEmail,
            clientWhatsapp,
            planType,
            formData,
            status: 'pending_payment' // O status inicial
        });

        const planPrice = PLAN_PRICES[planType];
        
        // 2. Cria a preferência de pagamento no Mercado Pago
        const preference = {
            items: [
                {
                    title: `Evolvi Nutri - Plano ${planType.charAt(0).toUpperCase() + planType.slice(1)}`,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: planPrice,
                },
            ],
            payer: {
                email: clientEmail,
            },
            back_urls: {
                success: `${process.env.FRONTEND_URL}/pagamento/sucesso`,
                failure: `${process.env.FRONTEND_URL}/pagamento/falha`,
                pending: `${process.env.FRONTEND_URL}/pagamento/pendente`,
            },
            // A URL que o Mercado Pago chamará quando o status do pagamento mudar
            notification_url: `${process.env.API_BASE_URL}/api/webhook/payment`,
            // A referência externa é o ID do nosso pedido no banco de dados!
            external_reference: newRequest.id.toString(),
        };
        
        const response = await mercadopago.preferences.create(preference);

        return {
            checkoutUrl: response.body.init_point,
            requestId: newRequest.id
        };
    }
}

module.exports = new CheckoutService();