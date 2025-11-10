import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Base de conhecimento do MarketHub CRM
const knowledge = {
  precos: {
    starter: 'R$ 49/mês - 1 marketplace, 100 produtos',
    professional: 'R$ 99/mês - 3 marketplaces, 500 produtos',
    business: 'R$ 199/mês - 5 marketplaces, 2.000 produtos',
    enterprise: 'R$ 399/mês - Ilimitado + suporte prioritário'
  },
  funcionalidades: [
    'Calculadora automática de taxas do Mercado Livre',
    'Cálculo de ICMS por estado (17-21%)',
    'Análise de regime tributário (Simples Nacional, Lucro Presumido, Lucro Real)',
    'Gestão de estoque com alertas automáticos',
    'Pausa/reativação automática de anúncios',
    'CMV (Custo de Mercadoria Vendida) automático',
    'Análise financeira completa (OPEX, Custos Fixos/Variáveis)',
    'Integração com Mercado Livre, Amazon e Shopee',
    'Autenticação 2FA para segurança',
    'Sistema multi-tenant SaaS'
  ],
  marketplaces: ['Mercado Livre', 'Amazon', 'Shopee'],
  trial: '14 dias grátis sem cartão de crédito',
  suporte: 'Email, chat e telefone (planos Business e Enterprise)'
};

// Função para salvar lead no localStorage
function saveLead(phone: string, interest: string) {
  const leads = JSON.parse(localStorage.getItem('markethub_leads') || '[]');
  leads.push({
    phone,
    interest,
    timestamp: new Date().toISOString(),
    source: 'chatbot'
  });
  localStorage.setItem('markethub_leads', JSON.stringify(leads));
}

// Função simples de IA para responder perguntas
function getAIResponse(question: string): string {
  const q = question.toLowerCase();
  
  // Preços
  if (q.includes('preço') || q.includes('quanto custa') || q.includes('valor') || q.includes('plano')) {
    return `📊 **Planos do MarketHub CRM:**\n\n` +
      `• **Starter**: ${knowledge.precos.starter}\n` +
      `• **Professional**: ${knowledge.precos.professional}\n` +
      `• **Business**: ${knowledge.precos.business}\n` +
      `• **Enterprise**: ${knowledge.precos.enterprise}\n\n` +
      `✨ Teste grátis por ${knowledge.trial}!`;
  }
  
  // Funcionalidades
  if (q.includes('funcionalidade') || q.includes('recurso') || q.includes('o que faz') || q.includes('como funciona')) {
    return `🚀 **Principais Funcionalidades:**\n\n` +
      knowledge.funcionalidades.slice(0, 5).map(f => `• ${f}`).join('\n') +
      `\n\n...e muito mais! Quer saber sobre alguma funcionalidade específica?`;
  }
  
  // Calculadora de taxas
  if (q.includes('calculadora') || q.includes('taxa') || q.includes('comissão') || q.includes('mercado livre')) {
    return `🧮 **Calculadora de Taxas ML:**\n\n` +
      `Nossa calculadora calcula automaticamente:\n` +
      `• Comissão do Mercado Livre (11-19% por categoria)\n` +
      `• ICMS por estado (17-21%)\n` +
      `• Impostos do regime tributário\n` +
      `• Custo de frete\n` +
      `• Taxa de pagamento\n` +
      `• Lucro líquido real\n\n` +
      `Você vê exatamente quanto vai ganhar em cada venda!`;
  }
  
  // Marketplaces
  if (q.includes('marketplace') || q.includes('integração') || q.includes('amazon') || q.includes('shopee')) {
    return `🔌 **Marketplaces Integrados:**\n\n` +
      knowledge.marketplaces.map(m => `• ${m}`).join('\n') +
      `\n\nSincronização automática de produtos, pedidos e estoque!`;
  }
  
  // Trial/Teste grátis
  if (q.includes('grátis') || q.includes('trial') || q.includes('teste') || q.includes('gratuito')) {
    return `🎁 **Teste Grátis:**\n\n` +
      `Sim! Oferecemos ${knowledge.trial}.\n\n` +
      `Você tem acesso completo a todas as funcionalidades do plano escolhido. ` +
      `Sem compromisso, sem pegadinhas!`;
  }
  
  // Suporte
  if (q.includes('suporte') || q.includes('ajuda') || q.includes('atendimento') || q.includes('contato')) {
    return `💬 **Suporte:**\n\n` +
      `${knowledge.suporte}\n\n` +
      `Nosso time está pronto para ajudar você a vender mais!`;
  }
  
  // Segurança
  if (q.includes('segurança') || q.includes('seguro') || q.includes('dados') || q.includes('2fa')) {
    return `🔐 **Segurança:**\n\n` +
      `• Autenticação de dois fatores (2FA) nativa\n` +
      `• Dados criptografados\n` +
      `• Backup automático\n` +
      `• Conformidade LGPD\n\n` +
      `Seus dados e dos seus clientes estão 100% protegidos!`;
  }
  
  // Demonstração
  if (q.includes('demonstração') || q.includes('demonstracao') || q.includes('demo') || q.includes('apresentação') || q.includes('ver funcionando')) {
    return `🎥 **Demonstração Personalizada:**\n\n` +
      `Adoraria mostrar o MarketHub CRM funcionando!\n\n` +
      `📱 Me passa seu WhatsApp que eu te mando:\n` +
      `• Vídeo de demonstração\n` +
      `• Link para agendar demo ao vivo\n` +
      `• Acesso trial de 14 dias\n\n` +
      `Digite seu número: (XX) XXXXX-XXXX`;
  }
  
  // Interesse/Quero testar
  if (q.includes('quero') || q.includes('interesse') || q.includes('contratar') || q.includes('começar')) {
    return `🚀 **Vamos começar!**\n\n` +
      `Ótima escolha! Para liberar seu acesso trial de 14 dias, preciso do seu WhatsApp.\n\n` +
      `📱 Digite seu número: (XX) XXXXX-XXXX\n\n` +
      `Vou te enviar:\n` +
      `• Link de acesso\n` +
      `• Tutorial em vídeo\n` +
      `• Suporte direto comigo`;
  }
  
  // Resposta padrão
  return `Olá! 👋 Sou o assistente virtual do MarketHub CRM.\n\n` +
    `Posso te ajudar com:\n` +
    `• Preços e planos\n` +
    `• Funcionalidades do sistema\n` +
    `• Calculadora de taxas\n` +
    `• Integrações com marketplaces\n` +
    `• Agendar demonstração\n` +
    `• Teste grátis\n\n` +
    `Sobre o que você gostaria de saber?`;
}

export default function ChatbotIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou o assistente virtual do MarketHub CRM. Como posso ajudar você hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsTyping(true);

    // Detectar telefone no input
    const phoneRegex = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/;
    const hasPhone = phoneRegex.test(userInput);

    // Simular delay de digitação da IA
    setTimeout(() => {
      let aiResponse = '';
      
      if (hasPhone) {
        // Salvar lead
        const phone = userInput.match(phoneRegex)?.[0] || userInput;
        const lastMessage = messages[messages.length - 1]?.content || '';
        saveLead(phone, lastMessage);
        
        aiResponse = `✅ **Perfeito!**\n\n` +
          `Recebi seu contato: ${phone}\n\n` +
          `📲 Vou te enviar agora no WhatsApp:\n` +
          `• Link para demonstração ao vivo\n` +
          `• Acesso trial de 14 dias\n` +
          `• Vídeo tutorial completo\n\n` +
          `🔗 **Link curto:** markethubcrm.com.br/demo\n\n` +
          `Enquanto isso, quer saber mais alguma coisa?`;
      } else {
        aiResponse = getAIResponse(userInput);
      }
      
      const assistantMessage: Message = { role: 'assistant', content: aiResponse };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <Button
          data-chatbot-button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-110 transition-transform z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Janela do chat */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col z-50 border-2">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Assistente MarketHub</h3>
                <p className="text-xs text-white/80">Online • Responde na hora</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-foreground border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border rounded-2xl px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white dark:bg-gray-950">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-900"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
