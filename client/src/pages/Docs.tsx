import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, Moon, Sun, BookOpen, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

export default function Docs() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const sections = [
    {
      title: "Começando",
      items: [
        { name: "Introdução", desc: "Visão geral da integração" },
        { name: "Instalação", desc: "Como instalar e configurar" },
        { name: "Configuração", desc: "Obter credenciais e tokens" }
      ]
    },
    {
      title: "Guias",
      items: [
        { name: "Uso com Manus", desc: "Como usar a integração" },
        { name: "Exemplos Práticos", desc: "Casos de uso reais" },
        { name: "Solução de Problemas", desc: "Resolver erros comuns" }
      ]
    },
    {
      title: "Referência",
      items: [
        { name: "API MarketHub CRM", desc: "Documentação da API" },
        { name: "Ferramentas MCP", desc: "16 ferramentas disponíveis" },
        { name: "Renovação de Tokens", desc: "Como renovar tokens" }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Documentação</h1>
              <p className="text-xs text-muted-foreground">Guias e referências</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-6xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {section.items.map((item, itemIndex) => (
                  <Card key={itemIndex} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {item.name}
                      </CardTitle>
                      <CardDescription>{item.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Links Úteis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="https://api.example.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                Portal da API MarketHub CRM <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="http://support.example.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                Suporte MarketHub CRM <ExternalLink className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
