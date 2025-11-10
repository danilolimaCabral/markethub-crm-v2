import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, CheckCircle2, Download, Moon, Sun, AlertCircle, Loader2, Copy } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Setup() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("credentials");
  const [loading, setLoading] = useState(false);
  
  const [credentials, setCredentials] = useState({
    clientId: "",
    clientSecret: "",
    authCode: ""
  });

  const [tokens, setTokens] = useState({
    accessToken: "",
    refreshToken: "",
    expiresIn: 0
  });

  const handleGenerateToken = async () => {
    if (!credentials.clientId || !credentials.clientSecret || !credentials.authCode) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    // Simulação de geração de token
    setTimeout(() => {
      setTokens({
        accessToken: "eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCIsInppcCI6IkRlZmxhdGUiLCJzZXIiOiIxLjAifQ...",
        refreshToken: "def50200abc...",
        expiresIn: 3600
      });
      setLoading(false);
      setActiveTab("tokens");
      toast.success("Token gerado com sucesso!");
    }, 2000);
  };

  const handleDownloadEnv = () => {
    const envContent = `MARKETHUB_API_KEY=${tokens.accessToken}
MARKETHUB_CLIENT_ID=${credentials.clientId}
MARKETHUB_CLIENT_SECRET=${credentials.clientSecret}
MARKETHUB_REFRESH_TOKEN=${tokens.refreshToken}
MARKETHUB_API_BASE_URL=https://api.example.com`;

    const blob = new Blob([envContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".env";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo .env baixado!");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Configuração</h1>
              <p className="text-xs text-muted-foreground">Configure sua integração</p>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credentials">1. Credenciais</TabsTrigger>
              <TabsTrigger value="tokens" disabled={!tokens.accessToken}>2. Tokens</TabsTrigger>
              <TabsTrigger value="download" disabled={!tokens.accessToken}>3. Download</TabsTrigger>
            </TabsList>

            {/* Tab 1: Credentials */}
            <TabsContent value="credentials" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Credenciais da API</CardTitle>
                  <CardDescription>
                    Insira as credenciais obtidas no portal do MarketHub CRM
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Onde obter:</strong> Acesse{" "}
                      <a
                        href="https://api.example.com/Autenticacao/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        api.example.com/Autenticacao/
                      </a>{" "}
                      para criar uma aplicação e obter Client ID e Secret
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      placeholder="abc123xyz789..."
                      value={credentials.clientId}
                      onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      placeholder="def456uvw012..."
                      value={credentials.clientSecret}
                      onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authCode">Authorization Code</Label>
                    <Input
                      id="authCode"
                      placeholder="ABC123XYZ789"
                      value={credentials.authCode}
                      onChange={(e) => setCredentials({ ...credentials, authCode: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Obtenha fazendo login em{" "}
                      <a
                        href="https://api.example.com/Autenticacao/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        api.example.com/Autenticacao/
                      </a>{" "}
                      e copiando o código da URL de redirecionamento
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleGenerateToken}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando Token...
                      </>
                    ) : (
                      "Gerar Access Token"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">💡 Dica</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    <strong>Passo 1:</strong> Crie uma conta de desenvolvedor em{" "}
                    <a
                      href="https://api.example.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      api.example.com/signup
                    </a>
                  </p>
                  <p>
                    <strong>Passo 2:</strong> Crie uma aplicação e obtenha Client ID e Secret
                  </p>
                  <p>
                    <strong>Passo 3:</strong> Faça login para obter o Authorization Code
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Tokens */}
            <TabsContent value="tokens" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <CardTitle>Tokens Gerados com Sucesso!</CardTitle>
                  </div>
                  <CardDescription>
                    Seus tokens foram gerados. Copie-os ou baixe o arquivo .env
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tokens.accessToken}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(tokens.accessToken, "Access Token")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Refresh Token</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tokens.refreshToken}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(tokens.refreshToken, "Refresh Token")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      O Access Token expira em {tokens.expiresIn} segundos (1 hora). Use o Refresh Token para renovar.
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full"
                    onClick={() => setActiveTab("download")}
                  >
                    Continuar para Download
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Download */}
            <TabsContent value="download" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Baixar Configuração</CardTitle>
                  <CardDescription>
                    Baixe o arquivo .env com todas as credenciais configuradas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <AlertDescription>
                      Configuração concluída! Baixe o arquivo .env e coloque na pasta da integração.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1">
                    <div>MARKETHUB_API_KEY={tokens.accessToken.substring(0, 30)}...</div>
                    <div>MARKETHUB_CLIENT_ID={credentials.clientId}</div>
                    <div>MARKETHUB_CLIENT_SECRET=***</div>
                    <div>MARKETHUB_REFRESH_TOKEN={tokens.refreshToken.substring(0, 20)}...</div>
                    <div>MARKETHUB_API_BASE_URL=https://api.example.com</div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleDownloadEnv}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Arquivo .env
                  </Button>

                  <div className="pt-4 space-y-2">
                    <h4 className="font-semibold">Próximos Passos:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Coloque o arquivo .env na pasta lexos-manus-integration/</li>
                      <li>Execute: ./instalar.sh</li>
                      <li>Teste a integração na aba "Testar"</li>
                      <li>Use o Manus normalmente!</li>
                    </ol>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation("/test")}
                    >
                      Testar Integração
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation("/dashboard")}
                    >
                      Ir para Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
