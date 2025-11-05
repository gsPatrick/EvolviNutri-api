'use strict';

// Importamos o serviço de webhook para REUTILIZAR as funções de GPT e WhatsApp
const webhookService = require('../webhook/webhook.service');

class TestService {
    /**
     * Orquestra o envio de uma mensagem de teste completa.
     */
    async sendTestWhatsApp() {
        const targetPhoneNumber = '71982862912';

        // 1. Criamos dados aleatórios de um cliente fictício.
        // A estrutura deve ser a mesma que a API real espera.
        const mockFormData = {
            clientName: "Cliente Teste",
            clientEmail: "teste@evolvinutri.com.br",
            clientWhatsapp: "71982862912",
            // Estes são os dados que a IA irá analisar
            formData: {
                gender: 'female',
                age: 28,
                weight: 65, // kg
                height: 168, // cm
                objective: 0.85, // Emagrecer
                activityLevel: 1.55, // Moderadamente ativo
                preferences: "Frango, salada, ovos, iogurte natural e frutas vermelhas.",
                restrictions: "Não gosto de peixe e tenho intolerância a lactose.",
                goal_details: "emagrecimento",
                budget: "medio",
            }
        };

        try {
            console.log(`[TESTE] Iniciando simulação de plano para ${targetPhoneNumber}...`);

            // 2. Chamamos a função existente para gerar o plano com a OpenAI
            console.log('[TESTE] Chamando a IA para gerar o plano...');
            const generatedPlan = await webhookService._generatePlanWithGPT(mockFormData.formData);

            if (!generatedPlan) {
                throw new Error('A IA não retornou um plano de teste. Verifique a API da OpenAI.');
            }
            console.log('[TESTE] Plano gerado com sucesso pela IA.');

            // 3. Chamamos a função existente para enviar o plano via Z-API
            console.log(`[TESTE] Enviando plano para o WhatsApp: ${targetPhoneNumber}`);
            await webhookService._sendPlanViaWhatsApp(targetPhoneNumber, generatedPlan);
            
            console.log('[TESTE] Mensagem de teste enviada com sucesso!');
            return { success: true, message: `Plano de teste enviado com sucesso para ${targetPhoneNumber}` };

        } catch (error) {
            console.error('[TestService] Falha grave no envio de teste:', error.message);
            // Lançamos o erro para que o controller possa capturá-lo
            throw new Error('Falha ao enviar a mensagem de teste. Verifique os logs do servidor.');
        }
    }
}

module.exports = new TestService();