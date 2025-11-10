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

    // Verificar se API Key está configurada
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY não está configurada!');
      return res.status(500).json({ error: 'API Key do Gemini não configurada' });
    }

    // Inicializar Gemini AI (dentro da rota para garantir que .env foi carregado)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

    const result = await chat.sendMessage(`${systemPrompt}\n\nUsuário: ${message}`);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Erro ao processar chat:', error);
    res.status(500).json({ 
      error: 'Erro ao processar mensagem',
      details: error.message 
    });
  }
});

export default router;
