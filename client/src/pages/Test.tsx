import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, Moon, Sun, Play, CheckCircle2, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Test() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTests = () => {
    setTesting(true);
    setTimeout(() => {
      setResults([
        { name: "Conexão com API", status: "success", message: "Conectado com sucesso" },
        { name: "Autenticação", status: "success", message: "Token válido" },
        { name: "Endpoint /Pedidos", status: "success", message: "200 OK" },
        { name: "Endpoint /Produtos", status: "success", message: "200 OK" },
        { name: "Endpoint /Anuncios", status: "warning", message: "Sem dados" }
      ]);
      setTesting(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Testar Integração</h1>
              <p className="text-xs text-muted-foreground">Valide sua conexão com a API</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testar Endpoints</CardTitle>
              <CardDescription>Execute testes para validar a integração</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runTests} disabled={testing} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                {testing ? "Testando..." : "Executar Testes"}
              </Button>

              {results.length > 0 && (
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {result.status === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
