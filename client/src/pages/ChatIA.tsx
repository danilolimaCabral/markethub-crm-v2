import { useState } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatIA() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou seu assistente inteligente do MarketHub CRM. Posso ajudá-lo com análises de dados, relatórios, previsões de vendas e muito mais. Como posso ajudar hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const exampleQuestions = [
    "Analise as vendas dos últimos 30 dias",
    "Quais produtos têm melhor margem de lucro?",
    "Preveja as vendas para o próximo mês",
    "Identifique padrões de compra dos clientes",
    "Sugira estratégias para aumentar vendas"
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simular resposta do ChatGPT
    // TODO: Integrar com API real do OpenAI
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: generateMockResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const generateMockResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes('vendas') || q.includes('faturamento')) {
      return `📊 **Análise de Vendas**

Com base nos dados do MarketHub CRM, aqui está uma análise detalhada:

**Últimos 30 dias:**
- Faturamento total: R$ 145.890,00
- Crescimento: +15% vs. mês anterior
- Ticket médio: R$ 294,17
- Total de pedidos: 496

**Destaques:**
- Mercado Livre lidera com 41% das vendas
- Amazon cresceu 23% no período
- Shopee mantém 16% de participação

**Recomendações:**
1. Aumentar investimento no Mercado Livre
2. Otimizar anúncios na Amazon
3. Diversificar portfólio na Shopee

Posso detalhar algum ponto específico?`;
    }
    
    if (q.includes('produto') || q.includes('margem') || q.includes('lucro')) {
      return `💰 **Análise de Produtos e Margem**

Produtos com melhor performance de margem:

**Top 5 Margens:**
1. Produto Premium A - 45% de margem
2. Produto Especial B - 38% de margem
3. Produto Elite C - 35% de margem
4. Produto Plus D - 32% de margem
5. Produto Gold E - 28% de margem

**Insights:**
- Produtos premium têm margem 2x maior
- Categoria Eletrônicos: margem média de 25%
- Categoria Casa: margem média de 30%

**Estratégias:**
- Aumentar mix de produtos premium
- Negociar melhores condições com fornecedores
- Criar bundles de produtos de alta margem

Quer que eu analise alguma categoria específica?`;
    }
    
    if (q.includes('previsão') || q.includes('próximo') || q.includes('futuro')) {
      return `🔮 **Previsão de Vendas**

Baseado em análise preditiva com IA:

**Próximo Mês (Dezembro):**
- Faturamento previsto: R$ 189.000,00 (+30%)
- Pedidos estimados: 645 (+30%)
- Ticket médio: R$ 293,00

**Fatores considerados:**
- Sazonalidade (Black Friday + Natal)
- Histórico dos últimos 12 meses
- Tendências de mercado
- Performance atual

**Preparação recomendada:**
1. Aumentar estoque em 35%
2. Reforçar equipe de atendimento
3. Preparar campanhas promocionais
4. Otimizar logística

Posso detalhar algum aspecto da previsão?`;
    }
    
    if (q.includes('cliente') || q.includes('padrão') || q.includes('comportamento')) {
      return `👥 **Análise de Comportamento de Clientes**

Padrões identificados pela IA:

**Segmentos principais:**
1. **Compradores Frequentes** (15%)
   - Compram 3+ vezes/mês
   - Ticket médio: R$ 450
   - Alta fidelidade

2. **Ocasionais** (45%)
   - Compram 1x/mês
   - Ticket médio: R$ 280
   - Sensíveis a promoções

3. **Esporádicos** (40%)
   - Compram 1x/trimestre
   - Ticket médio: R$ 180
   - Buscam preço baixo

**Padrões de compra:**
- Pico de vendas: Terça e Quinta (18h-21h)
- Produtos mais comprados juntos: A+B (32%)
- Taxa de recompra: 23%

**Recomendações:**
- Programa de fidelidade para frequentes
- Campanhas de reativação para esporádicos
- Cross-sell baseado em padrões

Quer explorar algum segmento específico?`;
    }
    
    if (q.includes('estratégia') || q.includes('aumentar') || q.includes('melhorar')) {
      return `🚀 **Estratégias para Aumentar Vendas**

Recomendações baseadas em IA e dados:

**1. Otimização de Anúncios**
- Investir 30% mais em produtos top 10
- Testar anúncios patrocinados no ML
- A/B testing de títulos e imagens

**2. Precificação Dinâmica**
- Ajustar preços por horário/dia
- Competir agressivamente em produtos-chave
- Premium pricing em exclusivos

**3. Cross-Selling**
- Sugerir produtos complementares
- Criar kits promocionais
- Implementar "Compre junto"

**4. Retenção de Clientes**
- Programa de pontos
- Cupons personalizados
- E-mail marketing segmentado

**5. Expansão de Canais**
- Testar Shopee e Magalu
- Criar loja própria
- Explorar Instagram Shopping

**Impacto esperado:** +25% em vendas em 3 meses

Quer que eu detalhe alguma estratégia?`;
    }
    
    return `Entendi sua pergunta sobre "${question}". 

Como assistente IA integrado ao MarketHub CRM, posso ajudá-lo com:

📊 Análise de dados e relatórios
💰 Insights financeiros e de margem
🔮 Previsões e tendências
👥 Comportamento de clientes
🚀 Estratégias de crescimento
📈 Otimização de vendas

Pode reformular sua pergunta ou escolher um dos exemplos acima?`;
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assistente IA</h1>
            <p className="text-muted-foreground">Powered by ChatGPT Pro</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 1 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Perguntas sugeridas:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {exampleQuestions.map((question, index) => (
                <Card
                  key={index}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleExampleClick(question)}
                >
                  <p className="text-sm text-foreground">{question}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className={message.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}>
                    {line}
                  </p>
                ))}
              </div>
              <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Digite sua pergunta... (Enter para enviar, Shift+Enter para nova linha)"
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Dica: Seja específico em suas perguntas para obter respostas mais precisas
        </p>
      </div>
    </div>
  );
}
