import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowRight, CheckCircle2, Moon, Settings, Sun, TestTube, BookOpen, Zap, Shield, Gauge } from "lucide-react";
import { useLocation } from "wouter";

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
    "Teste a conexão com o MarketHub CRM",
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
              <h1 className="text-xl font-bold">MarketHub CRM</h1>
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
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            🚀 Automatize seu e-commerce
          </div>
          <h2 className="text-5xl font-bold tracking-tight">
            Integre o <span className="text-primary">Manus</span> com o{" "}
            <span className="text-primary">MarketHub CRM</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Configure em minutos e comece a automatizar pedidos, estoque, anúncios e relatórios
            através de conversas naturais com o Manus.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setLocation("/setup")}
            >
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/docs")}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Documentação
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Como Funciona</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="pt-1">
                    <p className="text-lg">{step}</p>
                  </div>
                </div>
              ))}
            </div>
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Exemplo de Uso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-background rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground mb-2">Você:</p>
                  <p className="font-medium">"Manus, liste os pedidos pendentes do MarketHub CRM"</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Manus:</p>
                  <p className="font-medium text-sm">
                    "Encontrei 12 pedidos pendentes:
                    <br />• Mercado Livre: 8 pedidos
                    <br />• Amazon: 3 pedidos
                    <br />• Shopee: 1 pedido
                    <br />Total: R$ 3.450,00"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/20">
          <CardContent className="py-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Pronto para começar?</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Configure sua integração agora e comece a automatizar suas operações de e-commerce
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation("/setup")}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Configurar Integração
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/api")}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Consultar API
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Integração Manus × MarketHub CRM
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/docs" className="hover:text-foreground transition-colors">
                Documentação
              </a>
              <a
                href="http://support.example.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Suporte Lexos
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
