import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowRight, CheckCircle2, Moon, Settings, Sun, TestTube, BookOpen, Zap, Shield, Gauge, MessageSquare, Send, Github, Twitter, Linkedin } from "lucide-react";
import { useLocation } from "wouter";
import HeroCalculator from "@/components/HeroCalculator";

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Configuração Rápida",
      description: "Configure sua integração em menos de 5 minutos com nosso assistente interativo"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Seguro e Confiável",
      description: "Suas credenciais são armazenadas localmente e nunca compartilhadas"
    },
    {
      icon: <Gauge className="w-6 h-6" />,
      title: "Testes em Tempo Real",
      description: "Teste endpoints e valide sua integração antes de usar"
    }
  ];

  const steps = [
    "Configure suas credenciais da API",
    "Gere o Access Token automaticamente",
    "Teste a conexão com o Markthub CRM",
    "Use o Manus para automatizar suas operações"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">L</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Markthub CRM</h1>
              <p className="text-xs text-muted-foreground">Integração com Manus</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 lg:pt-40 lg:pb-48 bg-background overflow-hidden">
        {/* Abstract Speed Lines Background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-foreground/20 to-transparent transform -skew-x-12" />
          <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-foreground/20 to-transparent transform -skew-x-12" />
          <div className="absolute top-0 right-[-10%] w-[400px] h-[400px] bg-primary/10 blur-[120px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8 animate-in slide-in-from-left-10 duration-700 fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none border-l-4 border-primary bg-background/5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm font-mono text-primary uppercase tracking-widest">System Operational</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-foreground italic uppercase transform -skew-x-3 leading-[0.9]">
                Domine o <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Mercado Livre</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                Autointegração de alta performance para vendedores profissionais.
                <span className="text-foreground font-medium"> Sincronize. Venda. Escale.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Button
                  size="lg"
                  onClick={() => setLocation("/setup")}
                  className="h-14 px-8 text-lg font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-none skew-x-[-6deg] hover:skew-x-[-12deg] transition-all"
                >
                  <span className="skew-x-[6deg] hover:skew-x-[12deg] inline-flex items-center gap-2">
                    Start Engine <ArrowRight className="w-5 h-5" />
                  </span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => window.open('https://api.whatsapp.com/send?phone=5511999999999', '_blank')}
                  className="h-14 px-8 text-lg font-mono border-foreground/20 text-foreground hover:bg-foreground/5 hover:border-primary hover:text-primary rounded-none skew-x-[-6deg] transition-all"
                >
                  <span className="skew-x-[6deg]">
                    Fale com Consultor
                  </span>
                </Button>
              </div>

              <div className="pt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground font-mono">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-muted border border-background flex items-center justify-center text-[10px] text-muted-foreground">
                      U{i}
                    </div>
                  ))}
                </div>
                <span>+2.000 users online</span>
              </div>
            </div>

            {/* Right Visual - Calculator */}
            <div className="relative mt-8 lg:mt-0 flex items-center justify-center perspective-1000">
              <div className="relative w-full max-w-[500px] animate-in slide-in-from-right-10 duration-1000 delay-200 fade-in">
                <HeroCalculator />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden border-border/50 bg-background/40 backdrop-blur-sm hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
            >
              {/* Card Gradient Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="relative z-10 px-8 py-10">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-background to-muted border border-white/10 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <div className="text-primary group-hover:text-purple-400 transition-colors duration-500">
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed text-muted-foreground/80">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-24 bg-accent/5 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold tracking-tight mb-4">Como Funciona</h3>
            <p className="text-muted-foreground text-lg">
              Integração simplificada em 4 passos
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Steps Timeline */}
            <div className="space-y-12 relative">
              {/* Vertical Line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 to-transparent md:block hidden" />

              {steps.map((step, index) => (
                <div key={index} className="relative flex gap-6 group">
                  <div className="flex-shrink-0 w-14 h-14 bg-background border-2 border-primary/20 rounded-2xl flex items-center justify-center font-bold text-xl text-primary shadow-lg shadow-primary/10 z-10 group-hover:scale-110 group-hover:border-primary transition-all duration-300">
                    {index + 1}
                  </div>
                  <div className="pt-2">
                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{step}</h4>
                    <p className="text-muted-foreground">
                      {index === 0 && "Conecte suas contas de marketplace com segurança."}
                      {index === 1 && "Sistema gera tokens automaticamente sem complicação."}
                      {index === 2 && "Valide a conexão em tempo real com um clique."}
                      {index === 3 && "Comece a usar o chat para gerenciar suas vendas."}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Demo Chat UI */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary to-purple-600 rounded-2xl blur-2xl opacity-20" />
              <Card className="relative bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
                <CardHeader className="border-b bg-muted/30 px-6 py-4 flex flex-row items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="ml-auto text-xs text-muted-foreground font-mono">Manus Mobile v2.0</div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[400px] flex flex-col p-6 space-y-6 bg-gradient-to-b from-background to-accent/5">
                    {/* User Message */}
                    <div className="flex gap-4 justify-end">
                      <div className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl rounded-tr-none shadow-lg max-w-[80%]">
                        <p className="leading-relaxed">Manus, liste os pedidos pendentes do Markthub CRM</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/10">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                    </div>

                    {/* Bot Message */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-muted/50 border px-6 py-4 rounded-2xl rounded-tl-none shadow-sm max-w-[90%] space-y-3">
                        <p className="font-medium text-primary">Encontrei 12 pedidos pendentes:</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-background/80 p-3 rounded-lg border">
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider">Mercado Livre</span>
                            <span className="font-bold text-lg">8</span>
                          </div>
                          <div className="bg-background/80 p-3 rounded-lg border">
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider">Shopee</span>
                            <span className="font-bold text-lg">1</span>
                          </div>
                          <div className="bg-background/80 p-3 rounded-lg border">
                            <span className="block text-muted-foreground text-xs uppercase tracking-wider">Amazon</span>
                            <span className="font-bold text-lg">3</span>
                          </div>
                          <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                            <span className="block text-primary text-xs uppercase tracking-wider">Total</span>
                            <span className="font-bold text-lg text-primary">R$ 3.450,00</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                    <div className="relative">
                      <input
                        disabled
                        type="text"
                        placeholder="Digite sua mensagem..."
                        className="w-full pl-6 pr-12 py-4 rounded-xl bg-muted/50 border-transparent focus:ring-0 text-sm"
                      />
                      <div className="absolute right-2 top-2 p-2 bg-primary text-primary-foreground rounded-lg">
                        <Send className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-background border-t border-border/50">
        <div className="container relative mx-auto px-4">
          <div className="relative overflow-hidden bg-card border border-border p-12 lg:p-20 shadow-2xl">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 blur-[100px]" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="text-center md:text-left space-y-6">
                <h3 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-foreground leading-none transform -skew-x-3">
                  READY TO <span className="text-primary">RACE?</span>
                </h3>
                <p className="text-xl text-muted-foreground max-w-md font-light">
                  Join the elite performance tier of marketplace sellers today.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => setLocation("/setup")}
                  className="h-16 px-10 text-xl font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-none skew-x-[-6deg] transition-all"
                >
                  <span className="skew-x-[6deg]">Start Now</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0A0A0B] text-zinc-400">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">L</div>
                <span className="text-xl font-bold text-white">Markthub</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                A plataforma definitiva para automação e gestão de e-commerce com inteligência artificial.
              </p>
              <div className="flex gap-4 pt-2">
                <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6">Produto</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrações</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6">Recursos</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/docs" className="hover:text-primary transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Comunidade</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Segurança</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2025 Markthub CRM. Todos os direitos reservados.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos de Serviço</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
