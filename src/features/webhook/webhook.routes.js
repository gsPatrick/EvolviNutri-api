// src/features/webhook/webhook.routes.js
const { Router } = require('express');
const webhookController = require('./webhook.controller');

const router = Router();

// Endpoint que o Mercado Pago irá chamar quando um pagamento for aprovado
router.post('/payment', webhookController.handlePayment);

module.exports = router;