import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X, Send, Loader2, Ticket, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatGeminiProps {
  autoOpen?: boolean; // Se true, abre automaticamente após 2s
}

export default function ChatGemini({ autoOpen = false }: ChatGeminiProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketData, setTicketData] = useState({
    title: '',
    category: 'technical',
    priority: 'medium'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detectar se está na landing page ou no CRM
  const isLandingPage = location === '/home' || location === '/';
  const context = isLandingPage ? 'landing' : 'crm';

  // Mensagem inicial baseada no contexto
  const initialMessage = isLandingPage
    ? 'Olá! Sou a Mia, assistente virtual do MarketHub CRM. Como posso ajudar você hoje? 😊'
    : 'Olá! Sou a Mia, seu suporte 24/7 do MarketHub CRM. Estou aqui para ajudar com qualquer problema ou dúvida. Posso abrir um chamado para você ou responder perguntas diretamente!';

  // Inicializar mensagens
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date()
    }]);
  }, [context]);

  // Abrir automaticamente se autoOpen = true
  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp)
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketData.title.trim()) {
      alert('Por favor, preencha o título do chamado');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: ticketData.title,
          description: input.trim() || ticketData.title,
          category: ticketData.category,
          priority: ticketData.priority
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar chamado');
      }

      const data = await response.json();

      // Adicionar mensagem de confirmação
      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ Chamado #${data.ticket.id} criado com sucesso!\n\n${data.miaResponse || 'Estou analisando seu problema e retornarei em breve com uma solução.'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, confirmMessage]);
      setShowTicketForm(false);
      setTicketData({ title: '', category: 'technical', priority: 'medium' });
      setInput('');
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      alert('Erro ao criar chamado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
          aria-label="Abrir chat com Mia"
        >
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl flex flex-col overflow-hidden border-2 border-purple-500/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  Mia - {isLandingPage ? 'Assistente IA' : 'Suporte 24/7'}
                </h3>
                <p className="text-purple-100 text-xs">Powered by Gemini</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Botão Abrir Chamado (apenas no CRM) */}
          {!isLandingPage && !showTicketForm && (
            <div className="p-2 bg-purple-50 dark:bg-gray-900 border-b border-purple-200 dark:border-gray-700">
              <Button
                onClick={() => setShowTicketForm(true)}
                variant="outline"
                size="sm"
                className="w-full text-purple-600 border-purple-300 hover:bg-purple-100"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Abrir Chamado de Suporte
              </Button>
            </div>
          )}

          {/* Formulário de Ticket */}
          {showTicketForm && (
            <div className="p-4 bg-purple-50 dark:bg-gray-900 border-b border-purple-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  Novo Chamado
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTicketForm(false)}
                  className="h-6 px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <input
                type="text"
                placeholder="Título do chamado"
                value={ticketData.title}
                onChange={(e) => setTicketData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border rounded-md"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={ticketData.category}
                  onChange={(e) => setTicketData(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 text-sm border rounded-md"
                >
                  <option value="technical">Técnico</option>
                  <option value="billing">Financeiro</option>
                  <option value="feature_request">Sugestão</option>
                  <option value="bug">Bug</option>
                  <option value="other">Outro</option>
                </select>
                
                <select
                  value={ticketData.priority}
                  onChange={(e) => setTicketData(prev => ({ ...prev, priority: e.target.value }))}
                  className="px-3 py-2 text-sm border rounded-md"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              
              <Button
                onClick={handleCreateTicket}
                disabled={isLoading || !ticketData.title.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                size="sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Chamado'}
              </Button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/50 to-white dark:from-gray-900 dark:to-gray-950">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={showTicketForm ? "Descreva o problema..." : "Digite sua mensagem..."}
                className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
