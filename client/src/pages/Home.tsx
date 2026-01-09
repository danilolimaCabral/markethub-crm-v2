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

      {/* Diagnosis Section: Reality vs Markthub */}
      <section className="container mx-auto px-4 py-32">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground">
            Diagnóstico de <span className="text-primary">Performance</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A diferença entre sobreviver e dominar o mercado.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-0 max-w-5xl mx-auto rounded-3xl overflow-hidden border border-border bg-card shadow-2xl">
          {/* The Chaos (Reality) */}
          <div className="p-12 space-y-8 bg-zinc-900/50 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-red-500/5 blur-[100px]" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-muted-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500/50" />
                Sua Realidade Atual
              </h3>

              <ul className="space-y-6">
                {[
                  "Planilhas desatualizadas e erros manuais",
                  "Prejuízo com taxas de marketplace ocultas",
                  "Estoque furado e cancelamentos",
                  "Horas perdidas calculando margem",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/80">
                    <div className="w-6 h-6 rounded-full border border-red-500/20 flex items-center justify-center text-red-500/50 shrink-0">✕</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The Order (Markthub) */}
          <div className="p-12 space-y-8 bg-primary/5 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 p-32 bg-primary/20 blur-[100px]" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Com Markthub CRM
              </h3>

              <ul className="space-y-6">
                {[
                  "Dashboard unificado em tempo real",
                  "Cálculo automático de lucro líquido",
                  "Sincronização instantânea de estoque",
                  "Automação que roda 24/7 por você",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-foreground font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-lg shadow-primary/25">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="pt-8">
                <Button
                  variant="ghost"
                  className="group text-primary hover:text-primary hover:bg-primary/10 -ml-4"
                  onClick={() => setLocation("/setup")}
                >
                  Ver todas as vantagens
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="container mx-auto px-4 py-24 relative">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground">
            Ecossistema de <span className="text-primary">Potência</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

          {/* Main Feature - Large Card */}
          <Card className="md:col-span-2 md:row-span-2 relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <span className="font-bold">Central de Controle</span>
              </CardTitle>
              <CardDescription>Gerencie múltiplas contas em um único lugar.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-end justify-center p-0 bg-gradient-to-t from-background/50 to-transparent">
              <div className="w-[90%] h-[80%] bg-background border-t border-x border-border rounded-t-xl shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500 p-4">
                <div className="flex gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-1/2 bg-muted rounded animate-pulse delay-75" />
                  <div className="h-2 w-full bg-muted rounded animate-pulse delay-150" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side Feature 1 */}
          <Card className="relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-bold">Respostas Rápidas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">IA treinada para responder perguntas de pré-venda em segundos.</p>
            </CardContent>
          </Card>

          {/* Side Feature 2 */}
          <Card className="relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-bold">Anti-Bloqueio</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Proteção de conta e monitoramento de reputação 24/7.</p>
            </CardContent>
          </Card>

          {/* Bottom Wide Feature */}
          <Card className="md:col-span-3 relative overflow-hidden bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent" />
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Gauge className="w-6 h-6 text-primary" />
                  Acelere suas Vendas
                </h3>
                <p className="text-muted-foreground max-w-xl">
                  Nossos usuários relatam um aumento médio de 32% no faturamento nos primeiros 3 meses.
                </p>
              </div>
              <Button onClick={() => setLocation("/setup")} className="shrink-0 bg-primary text-primary-foreground font-bold">
                Ver Plano de Aceleração <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

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
