// src/routes/index.js
const { Router } = require('express');
const webhookRoutes = require('../features/webhook/webhook.routes');
const checkoutRoutes = require('../features/checkout/checkout.routes'); // <-- IMPORTAR

const router = Router();

// Centraliza todas as rotas da aplicação
router.use('/webhook', webhookRoutes);
router.use('/checkout', checkoutRoutes); // <-- USAR A NOVA ROTA

module.exports = router;