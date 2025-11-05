// src/routes/index.js
const { Router } = require('express');
const webhookRoutes = require('../features/webhook/webhook.routes');
const checkoutRoutes = require('../features/checkout/checkout.routes');
const testRoutes = require('../features/test/test.routes'); // <-- ADICIONE ESTA LINHA

const router = Router();

// Centraliza todas as rotas da aplicação
router.use('/webhook', webhookRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/test', testRoutes); // <-- ADICIONE ESTA LINHA

module.exports = router;