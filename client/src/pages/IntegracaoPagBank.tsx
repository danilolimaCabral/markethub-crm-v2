import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Shield,
  Zap,
  DollarSign,
  BarChart3
} from "lucide-react";
import { toast } from 'sonner';

export default function IntegracaoPagBank() {

  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const [credentials, setCredentials] = useState({
    email: "",
    token: "",
    environment: "production" as "production" | "sandbox"
  });

  const handleConnect = async () => {
    if (!credentials.email || !credentials.token) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    
    try {
      // Aqui será implementada a lógica de conexão com PagBank
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnected(true);
      toast.success('Sua conta PagBank foi conectada ao sistema.');
    } catch (error) {
      toast.error('Não foi possível conectar com o PagBank. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setCredentials({
      email: "",
      token: "",
      environment: "production"
    });
    toast.success('Sua conta PagBank foi desconectada.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integração PagBank</h1>
            <p className="text-gray-600">Gateway de pagamento PagSeguro</p>
          </div>
        </div>
        
        {connected && (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        )}
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento API</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          {/* Card de Conexão */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <CardTitle>Conectar PagBank</CardTitle>
              </div>
              <CardDescription>
                Configure suas credenciais do PagBank para processar pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail da Conta PagBank *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  disabled={connected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token de Autenticação *</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Seu token de autenticação"
                  value={credentials.token}
                  onChange={(e) => setCredentials({ ...credentials, token: e.target.value })}
                  disabled={connected}
                />
                <p className="text-sm text-gray-500">
                  Obtenha seu token no painel do PagBank
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente</Label>
                <select
                  id="environment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={credentials.environment}
                  onChange={(e) => setCredentials({ ...credentials, environment: e.target.value as "production" | "sandbox" })}
                  disabled={connected}
                >
                  <option value="production">Produção</option>
                  <option value="sandbox">Sandbox (Testes)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                {!connected ? (
                  <Button 
                    onClick={handleConnect} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Conectando..." : "Conectar com PagBank"}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1">
                      Testar Conexão
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDisconnect}
                      className="flex-1"
                    >
                      Desconectar
                    </Button>
                  </>
                )}
              </div>

              <div className="pt-4 border-t">
                <a 
                  href="https://pagseguro.uol.com.br/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Acessar Painel PagBank
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Benefícios e Requisitos */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Benefícios */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <CardTitle>Benefícios</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Pagamentos seguros com certificação PCI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <DollarSign className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Múltiplas formas de pagamento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Processamento em tempo real</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Relatórios detalhados de transações</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Requisitos */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <CardTitle>Requisitos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">1</span>
                    </div>
                    <span className="text-sm">Conta ativa no PagBank/PagSeguro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">2</span>
                    </div>
                    <span className="text-sm">Token de autenticação gerado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">3</span>
                    </div>
                    <span className="text-sm">Webhook configurado (opcional)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle>Como Configurar</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-sm">Acesse o painel do PagBank/PagSeguro</li>
                <li className="text-sm">Vá em Configurações → Integrações</li>
                <li className="text-sm">Gere um novo token de autenticação</li>
                <li className="text-sm">Copie o token e cole no campo acima</li>
                <li className="text-sm">Clique em "Conectar com PagBank"</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status da API PagBank</CardTitle>
              <CardDescription>
                Monitoramento em tempo real da integração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div>
                      <p className="font-medium">API PagBank</p>
                      <p className="text-sm text-gray-600">Gateway de pagamento</p>
                    </div>
                  </div>
                  <Badge variant="outline">Aguardando configuração</Badge>
                </div>

                <div className="text-sm text-gray-600">
                  <p>Configure a integração na aba "Configuração" para começar o monitoramento.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
