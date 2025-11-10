import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Calculator, TrendingUp, Bell, Shield, Zap, Users, BarChart3, ArrowRight, Star, Instagram, Facebook, Linkedin, Youtube, Twitter } from 'lucide-react';
import { useLocation } from 'wouter';
import ChatbotIA from '@/components/ChatbotIA';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Intersection Observer para animações de scroll
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observar todos os elementos com classe 'scroll-animate'
    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Chatbot IA */}
      <ChatbotIA />
      
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo - Melhor alinhamento */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setLocation('/')}>
              <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                  MarketHub CRM
                </span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">
                  Venda mais, lucre mais
                </span>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#funcionalidades" className="text-sm font-medium hover:text-purple-600 transition-colors duration-200">
                Funcionalidades
              </a>
              <a href="#precos" className="text-sm font-medium hover:text-purple-600 transition-colors duration-200">
                Preços
              </a>
              <a href="#depoimentos" className="text-sm font-medium hover:text-purple-600 transition-colors duration-200">
                Depoimentos
              </a>
              <a href="#faq" className="text-sm font-medium hover:text-purple-600 transition-colors duration-200">
                FAQ
              </a>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/cadastro')}
                className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-all duration-200"
              >
                Área do Cliente
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105" 
                onClick={() => setLocation('/cadastro')}
              >
                Começar Grátis
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 scroll-animate">
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 hover:scale-105 transition-transform duration-200">
              🚀 Especializado em Marketplaces
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Venda Mais no{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                Mercado Livre
              </span>{' '}
              com Inteligência
            </h1>
            
            <p className="text-xl text-muted-foreground">
              O único CRM que calcula automaticamente <strong>todas as taxas do Mercado Livre</strong>, 
              gerencia seu estoque e mostra seu <strong>lucro líquido real</strong>. 
              Pare de perder dinheiro sem saber.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-lg px-8 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => setLocation('/cadastro')}
              >
                Testar 14 Dias Grátis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                onClick={() => {
                  // Abrir chatbot
                  const chatButton = document.querySelector('[data-chatbot-button]') as HTMLButtonElement;
                  if (chatButton) {
                    chatButton.click();
                  }
                }}
              >
                Ver Demonstração
              </Button>
            </div>
            
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-sm">Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-sm">Cancele quando quiser</span>
              </div>
            </div>
          </div>

          {/* Calculadora Preview - Com animação */}
          <Card className="p-6 shadow-2xl scroll-animate hover:shadow-3xl transition-shadow duration-300 border-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-600">
                <Calculator className="h-5 w-5" />
                <h3 className="font-semibold">Calculadora de Taxas ML</h3>
              </div>
              <p className="text-sm text-muted-foreground">Veja quanto vai realmente lucrar</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preço de Venda</p>
                  <p className="text-2xl font-bold">R$ 89,90</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Custo</p>
                  <p className="text-2xl font-bold">R$ 45,90</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comissão ML (13%)</span>
                  <span className="text-red-600">-R$ 11,69</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ICMS Goiás (19%)</span>
                  <span className="text-red-600">-R$ 17,08</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Simples Nacional (6.5%)</span>
                  <span className="text-red-600">-R$ 5,84</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa Pix (0.99%)</span>
                  <span className="text-red-600">-R$ 0,89</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Lucro Líquido Real</span>
                  <span className="text-3xl font-bold text-green-600">R$ 8,50</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Margem: 9.46%</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Social Proof - Com animação */}
      <section className="bg-white dark:bg-gray-800 py-12 scroll-animate">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="hover:scale-110 transition-transform duration-300">
              <div className="text-4xl font-bold text-purple-600">500+</div>
              <div className="text-sm text-muted-foreground">Vendedores Ativos</div>
            </div>
            <div className="hover:scale-110 transition-transform duration-300">
              <div className="text-4xl font-bold text-purple-600">R$ 2M+</div>
              <div className="text-sm text-muted-foreground">Economizados em Taxas</div>
            </div>
            <div className="hover:scale-110 transition-transform duration-300">
              <div className="text-4xl font-bold text-purple-600">98%</div>
              <div className="text-sm text-muted-foreground">Satisfação</div>
            </div>
            <div className="hover:scale-110 transition-transform duration-300">
              <div className="text-4xl font-bold text-purple-600 flex items-center justify-center gap-1">
                4.9 <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-sm text-muted-foreground">Avaliação Média</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema vs Solução */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 scroll-animate">
          <Badge className="mb-4 bg-red-100 text-red-700">
            ⚠️ Você está perdendo dinheiro!
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Sabe quanto <span className="text-red-600">realmente</span> está lucrando?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A maioria dos vendedores de marketplace não calcula corretamente suas taxas e 
            acaba vendendo com prejuízo sem perceber.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Sem MarketHub */}
          <Card className="border-2 border-red-200 scroll-animate hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <span className="text-2xl">❌</span>
                <CardTitle>Sem o MarketHub</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <p className="text-sm">Calcula taxas manualmente em planilhas</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <p className="text-sm">Esquece de considerar ICMS do estado</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <p className="text-sm">Não sabe margem de contribuição real</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <p className="text-sm">Vende produto sem estoque</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <p className="text-sm">Perde tempo com tarefas manuais</p>
              </div>
            </CardContent>
          </Card>

          {/* Com MarketHub */}
          <Card className="border-2 border-green-200 scroll-animate hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-2 text-green-600">
                <span className="text-2xl">✅</span>
                <CardTitle>Com o MarketHub</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Calcula todas as taxas automaticamente</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Considera ICMS do seu estado (17-21%)</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Mostra lucro líquido após impostos</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Pausa anúncios quando zera estoque</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm">Economiza 10h/semana em gestão</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="bg-white dark:bg-gray-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 scroll-animate">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground">
              Funcionalidades que nenhum outro CRM ou ERP oferece para vendedores de marketplace
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="scroll-animate hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Calculadora Inteligente</CardTitle>
                <CardDescription>
                  Calcula automaticamente comissão ML, ICMS por estado, impostos do regime tributário e mostra lucro real
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="scroll-animate hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Alertas Automáticos</CardTitle>
                <CardDescription>
                  Receba notificações quando estoque baixar, pausa anúncios quando zerar e reativa ao repor
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="scroll-animate hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Análise Financeira</CardTitle>
                <CardDescription>
                  CMV, margem de contribuição, OPEX, custos fixos e variáveis. Saiba exatamente onde está seu dinheiro
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="scroll-animate hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Relatórios Avançados</CardTitle>
                <CardDescription>
                  Lucratividade por produto, análise de vendas, produtos mais rentáveis e métricas de performance
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="scroll-animate hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle>Segurança 2FA</CardTitle>
                <CardDescription>
                  Autenticação de dois fatores nativa, backup automático e conformidade LGPD. Seus dados protegidos
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="scroll-animate hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>
                  Conecte Mercado Livre, Amazon, Shopee. Sincronização automática de produtos e pedidos
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 scroll-animate hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Pronto para aumentar seus lucros?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Junte-se a centenas de vendedores que já estão economizando milhares em taxas
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 hover:scale-105 transition-transform duration-200"
              onClick={() => setLocation('/cadastro')}
            >
              Começar Trial Gratuito de 14 Dias
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm mt-4 text-white/80">
              Sem cartão de crédito • Cancele quando quiser
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">MarketHub CRM</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                O CRM especializado em vendedores de marketplace
              </p>
              
              {/* Redes Sociais */}
              <div className="flex items-center gap-3">
                <a 
                  href="https://instagram.com/markethubcrm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a 
                  href="https://facebook.com/markethubcrm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-all duration-300 hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a 
                  href="https://linkedin.com/company/markethubcrm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all duration-300 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a 
                  href="https://youtube.com/@markethubcrm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition-all duration-300 hover:scale-110"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a 
                  href="https://twitter.com/markethubcrm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-sky-500 transition-all duration-300 hover:scale-110"
                  aria-label="Twitter/X"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#funcionalidades" className="hover:text-white transition">Funcionalidades</a></li>
                <li><a href="#precos" className="hover:text-white transition">Preços</a></li>
                <li><a href="#" className="hover:text-white transition">Integrações</a></li>
                <li><a href="#" className="hover:text-white transition">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Tutoriais</a></li>
                <li><a href="#" className="hover:text-white transition">Base de Conhecimento</a></li>
                <li><a href="#" className="hover:text-white transition">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
                <li><a href="#" className="hover:text-white transition">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition">Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2025 MarketHub CRM. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* CSS para animações */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .scroll-animate {
          opacity: 0;
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
