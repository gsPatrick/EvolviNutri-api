
'use strict';

const { Router } = require('express');
const testController = require('./test.controller');

const router = Router();

// Definimos uma rota GET que, quando acessada, chama o nosso controller
router.get('/send-whatsapp', testController.triggerTestSend);

module.exports = router;