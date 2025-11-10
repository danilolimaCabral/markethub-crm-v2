import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Endpoint para chat com Mia
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Verificar se API Key está configurada (tentar GOOGLE_AI_KEY primeiro, depois GEMINI_API_KEY)
    const apiKey = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY;
    console.log('🔍 DEBUG: Verificando API Keys...');
    console.log('🔍 DEBUG: GOOGLE_AI_KEY existe?', !!process.env.GOOGLE_AI_KEY);
    console.log('🔍 DEBUG: GEMINI_API_KEY existe?', !!process.env.GEMINI_API_KEY);
    console.log('🔍 DEBUG: API Key selecionada primeiros 10 chars:', apiKey?.substring(0, 10));
    
    if (!apiKey) {
      console.error('❌ ERRO: Nenhuma API Key configurada (GOOGLE_AI_KEY ou GEMINI_API_KEY)!');
      return res.status(500).json({ error: 'API Key do Gemini não configurada' });
    }

    // Inicializar Gemini AI (dentro da rota para garantir que .env foi carregado)
    console.log('🚀 DEBUG: Inicializando GoogleGenerativeAI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('🚀 DEBUG: Obtendo modelo gemini-2.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Definir contexto baseado na origem
    const systemPrompt = context === 'landing' 
      ? `Você é Mia, a assistente virtual do MarketHub CRM. 
         Você está conversando com um visitante da landing page que ainda não é cliente.
         Seu objetivo é:
         - Responder perguntas sobre o MarketHub CRM
         - Explicar funcionalidades e benefícios
         - Ajudar com dúvidas sobre preços e planos
         - Ser amigável, profissional e persuasiva
         - Incentivar o cadastro no trial gratuito
         
         Características do MarketHub CRM:
         - Calculadora automática de taxas do Mercado Livre
         - Gestão completa de pedidos, produtos e estoque
         - Análise financeira com CMV, margem de contribuição
         - Integração com Mercado Livre, Amazon, Shopee
         - Alertas automáticos de estoque
         - Relatórios avançados de lucratividade
         - Trial gratuito de 14 dias
         
         Seja concisa e objetiva nas respostas.`
      : `Você é Mia, a assistente inteligente do MarketHub CRM.
         Você está conversando com um usuário logado no sistema.
         Seu objetivo é:
         - Ajudar com análise de dados do CRM
         - Fornecer insights sobre vendas e finanças
         - Sugerir ações baseadas nos dados
         - Responder perguntas sobre funcionalidades
         
         Seja profissional, analítica e proativa.`;

    // Gerar resposta
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    console.log('💬 DEBUG: Enviando mensagem para Gemini...');
    const result = await chat.sendMessage(`${systemPrompt}\n\nUsuário: ${message}`);
    console.log('✅ DEBUG: Resposta recebida do Gemini!');
    const response = await result.response;
    const text = response.text();
    console.log('✅ DEBUG: Texto extraído:', text.substring(0, 50) + '...');

    res.json({ 
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ ERRO ao processar chat:', error);
    console.error('❌ ERRO stack:', error.stack);
    console.error('❌ ERRO message:', error.message);
    console.error('❌ ERRO status:', error.status);
    console.error('❌ ERRO response:', error.response?.data);
    res.status(500).json({ 
      error: 'Erro ao processar mensagem',
      details: error.message,
      status: error.status,
      errorData: error.response?.data
    });
  }
});

export default router;
