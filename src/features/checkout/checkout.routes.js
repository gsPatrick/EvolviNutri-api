// src/features/checkout/checkout.routes.js
const { Router } = require('express');
const checkoutController = require('./checkout.controller');

const router = Router();

// Rota pública que o frontend chamará para iniciar o pagamento
router.post("/create-payment", checkoutController.createPayment);

module.exports = router;