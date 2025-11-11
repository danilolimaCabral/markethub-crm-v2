import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting: máximo 20 requisições por minuto por IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 requisições
  message: 'Muitas requisições. Por favor, aguarde um momento e tente novamente.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Endpoint para chat com Mia
router.post('/chat', limiter, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Verificar se API Key está configurada (tentar GOOGLE_AI_KEY primeiro, depois GEMINI_API_KEY)
    const apiKey = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ ERRO: Nenhuma API Key configurada (GOOGLE_AI_KEY ou GEMINI_API_KEY)!');
      return res.status(500).json({ error: 'API Key do Gemini não configurada' });
    }

    // Inicializar Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
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
         - Trial gratuito de 14 dias SEM CARTÃO DE CRÉDITO
         
         PLANOS E PREÇOS:
         - Starter: R$ 97/mês - Até 100 pedidos/mês, ideal para pequenos vendedores
         - Professional: R$ 197/mês - Até 500 pedidos/mês, integrações completas
         - Business: R$ 397/mês - Pedidos ilimitados, multi-marketplace, API
         - Enterprise: R$ 797/mês - Tudo + Suporte prioritário, White label
         
         HORÁRIO DE ATENDIMENTO:
         - Eu (Mia) estou disponível 24/7 para responder perguntas!
         - Suporte humano: Segunda a Sexta, 9h às 18h (horário de Brasília)
         - E-mail: suporte@markethub.com.br
         - WhatsApp: (62) 99999-9999
         
         DIFERENCIAIS ÚNICOS:
         - ÚNICA ferramenta do mercado com IA integrada (eu!)
         - Calculadora de taxas ML mais precisa do Brasil
         - Considera ICMS por estado (Goiás 19%, SP 18%, etc)
         - Mostra lucro líquido REAL após todas as taxas
         
         Seja concisa, objetiva e sempre destaque o trial gratuito de 14 dias!`
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
    console.error('❌ Erro ao processar chat com Gemini:', error.message);
    res.status(500).json({ 
      error: 'Erro ao processar mensagem. Por favor, tente novamente.'
    });
  }
});

export default router;
