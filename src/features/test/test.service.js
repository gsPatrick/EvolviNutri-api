'use strict';

// Importamos o serviço de webhook para REUTILIZAR as funções de GPT e WhatsApp
const webhookService = require('../webhook/webhook.service');

class TestService {
    /**
     * Orquestra o envio de uma mensagem de teste completa com dados detalhados.
     */
    async sendTestWhatsApp() {
        const targetPhoneNumber = '13981086937';

        // =================================================================================
        // DADOS SIMULADOS - ATUALIZADOS COM TODAS AS RESPOSTAS DO NOVO FORMULÁRIO
        // =================================================================================
        const mockFormData = {
            // Dados da calculadora (simulados)
            calculator: {
                gender: 'male',
                age: 30,
                weight: 85, // kg
                height: 180, // cm
                objective: 1.07, // Ganhos Secos (+7%)
                activityLevel: 1.725, // Muito ativo
            },
            // Dados do novo formulário de anamnese (simulados)
            anamnese: {
                name: "João da Silva (Teste)",
                email: "joao.teste@evolvinutri.com.br",
                whatsapp: "71982862912",
                horario_treino: "18:00",
                num_refeicoes: "5",
                preferencia_preparo: "Um misto, praticidade no dia a dia e algo mais elaborado à noite.",
                relato_rotina: "Trabalho em um escritório das 9h às 18h. Vou para a academia de musculação logo depois, por volta das 18:30h, e chego em casa às 20h.",
                alimentos_gosta: "Frango, carne vermelha, ovos, batata doce, arroz, aveia, iogurte.",
                alimentos_nao_gosta: "Fígado, quiabo, beterraba.",
                alimentos_indispensaveis: "Café preto pela manhã e uma fruta no lanche da tarde.",
                alergias_intolerancias: "Nenhuma alergia ou intolerância.",
                frutas_consumo: "Banana, Maçã, Morango, Abacate, Uva.",
                legumes_consumo: "Cenoura, brócolis, abobrinha, tomate, pimentão.",
                hortalicas_consumo: "Alface, rúcula, couve, espinafre.",
                suplementos: "Uso Whey Protein no pós-treino e Creatina (5g) pela manhã."
            }
        };

        // Combina os dados exatamente como o frontend faria
        const combinedDataForAI = {
            ...mockFormData.calculator,
            ...mockFormData.anamnese
        };

        try {
            console.log(`[TESTE] Iniciando simulação de plano detalhado para ${targetPhoneNumber}...`);

            // 2. Chamamos a função existente para gerar o plano com a OpenAI
            console.log('[TESTE] Chamando a IA para gerar o plano com dados completos...');
            const generatedPlan = await webhookService._generatePlanWithGPT(combinedDataForAI);

            if (!generatedPlan) {
                throw new Error('A IA não retornou um plano de teste. Verifique a API da OpenAI.');
            }
            console.log('[TESTE] Plano detalhado gerado com sucesso pela IA.');

            // 3. Chamamos a função existente para enviar o plano via Z-API
            console.log(`[TESTE] Enviando plano para o WhatsApp: ${targetPhoneNumber}`);
            await webhookService._sendPlanViaWhatsApp(targetPhoneNumber, generatedPlan);
            
            console.log('[TESTE] Mensagem de teste enviada com sucesso!');
            return { success: true, message: `Plano de teste detalhado enviado com sucesso para ${targetPhoneNumber}` };

        } catch (error) {
            console.error('[TestService] Falha grave no envio de teste:', error.message);
            // Lançamos o erro para que o controller possa capturá-lo
            throw new Error('Falha ao enviar a mensagem de teste. Verifique os logs do servidor.');
        }
    }
}

module.exports = new TestService();