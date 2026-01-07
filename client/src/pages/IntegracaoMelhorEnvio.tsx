import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Zap,
  DollarSign,
  Package,
  BarChart3
} from "lucide-react";
import { toast } from 'sonner';

export default function IntegracaoMelhorEnvio() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const [credentials, setCredentials] = useState({
    clientId: "",
    clientSecret: "",
    accessToken: "",
    environment: "production" as "production" | "sandbox"
  });

  const handleConnect = async () => {
    if (!credentials.clientId || !credentials.clientSecret) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha Client ID e Client Secret.",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Aqui será implementada a lógica de conexão com Melhor Envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnected(true);
      toast.success("Conectado com sucesso!", {
        description: "Sua integração com Melhor Envio foi configurada.",
      });
    } catch (error) {
      toast.error("Erro ao conectar", {
        description: "Não foi possível conectar com o Melhor Envio. Verifique suas credenciais.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setCredentials({
      clientId: "",
      clientSecret: "",
      accessToken: "",
      environment: "production"
    });
    toast.success("Desconectado", {
        description: "Sua integração com Melhor Envio foi desconectada.",
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integração Melhor Envio</h1>
            <p className="text-gray-600">Cotação e gestão de envios</p>
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
                <Truck className="w-5 h-5" />
                <CardTitle>Conectar Melhor Envio</CardTitle>
              </div>
              <CardDescription>
                Configure suas credenciais do Melhor Envio para cotação e gestão de envios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  type="text"
                  placeholder="Seu Client ID"
                  value={credentials.clientId}
                  onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                  disabled={connected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret *</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Seu Client Secret"
                  value={credentials.clientSecret}
                  onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                  disabled={connected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token (Opcional)</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="Token de acesso"
                  value={credentials.accessToken}
                  onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                  disabled={connected}
                />
                <p className="text-sm text-gray-500">
                  Será gerado automaticamente se não fornecido
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
                    {loading ? "Conectando..." : "Conectar com Melhor Envio"}
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
                  href="https://melhorenvio.com.br/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Acessar Painel Melhor Envio
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
                    <DollarSign className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Cotação de múltiplas transportadoras</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Geração automática de etiquetas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Package className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Rastreamento centralizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Relatórios e análises de envios</span>
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
                    <span className="text-sm">Conta ativa no Melhor Envio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">2</span>
                    </div>
                    <span className="text-sm">Aplicativo criado no painel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">3</span>
                    </div>
                    <span className="text-sm">Client ID e Secret gerados</span>
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
                <li className="text-sm">Acesse o painel do Melhor Envio</li>
                <li className="text-sm">Vá em Configurações → Aplicativos</li>
                <li className="text-sm">Crie um novo aplicativo</li>
                <li className="text-sm">Copie o Client ID e Client Secret</li>
                <li className="text-sm">Cole as credenciais nos campos acima</li>
                <li className="text-sm">Clique em "Conectar com Melhor Envio"</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status da API Melhor Envio</CardTitle>
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
                      <p className="font-medium">API Melhor Envio</p>
                      <p className="text-sm text-gray-600">Cotação e gestão de envios</p>
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
