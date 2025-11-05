'use strict';

const testService = require('./test.service');

class TestController {
    /**
     * Lida com a requisição GET para disparar o envio de teste.
     */
    async triggerTestSend(req, res) {
        try {
            console.log('[TESTE] Endpoint de teste ativado.');
            const result = await testService.sendTestWhatsApp();
            res.status(200).json(result);
        } catch (error) {
            // Se o serviço lançar um erro, o enviamos como resposta
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new TestController();