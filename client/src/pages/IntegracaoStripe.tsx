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
  Globe,
  Lock,
  Zap,
  TrendingUp
} from "lucide-react";
import { toast } from 'sonner';

export default function IntegracaoStripe() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const [credentials, setCredentials] = useState({
    publishableKey: "",
    secretKey: "",
    webhookSecret: ""
  });

  const handleConnect = async () => {
    if (!credentials.publishableKey || !credentials.secretKey) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha as chaves Publishable e Secret.",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Aqui será implementada a lógica de conexão com Stripe
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnected(true);
      toast.success("Conectado com sucesso!", {
        description: "Sua conta Stripe foi conectada ao sistema.",
      });
    } catch (error) {
      toast.error("Erro ao conectar", {
        description: "Não foi possível conectar com o Stripe. Verifique suas credenciais.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setCredentials({
      publishableKey: "",
      secretKey: "",
      webhookSecret: ""
    });
    toast.success("Desconectado", {
        description: "Sua conta Stripe foi desconectada.",
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integração Stripe</h1>
            <p className="text-gray-600">Gateway de pagamento internacional</p>
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
                <CardTitle>Conectar Stripe</CardTitle>
              </div>
              <CardDescription>
                Configure suas chaves de API do Stripe para processar pagamentos internacionais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publishableKey">Publishable Key *</Label>
                <Input
                  id="publishableKey"
                  type="text"
                  placeholder="pk_live_..."
                  value={credentials.publishableKey}
                  onChange={(e) => setCredentials({ ...credentials, publishableKey: e.target.value })}
                  disabled={connected}
                />
                <p className="text-sm text-gray-500">
                  Chave pública para uso no frontend
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key *</Label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="sk_live_..."
                  value={credentials.secretKey}
                  onChange={(e) => setCredentials({ ...credentials, secretKey: e.target.value })}
                  disabled={connected}
                />
                <p className="text-sm text-gray-500">
                  Chave secreta para uso no backend
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret (Opcional)</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  placeholder="whsec_..."
                  value={credentials.webhookSecret}
                  onChange={(e) => setCredentials({ ...credentials, webhookSecret: e.target.value })}
                  disabled={connected}
                />
                <p className="text-sm text-gray-500">
                  Secret para validar webhooks do Stripe
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                {!connected ? (
                  <Button 
                    onClick={handleConnect} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Conectando..." : "Conectar com Stripe"}
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
                  href="https://dashboard.stripe.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Acessar Dashboard Stripe
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
                    <Globe className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Pagamentos em mais de 135 moedas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Segurança de nível bancário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">API moderna e bem documentada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Taxas competitivas e transparentes</span>
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
                    <span className="text-sm">Conta ativa no Stripe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">2</span>
                    </div>
                    <span className="text-sm">Chaves de API geradas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">3</span>
                    </div>
                    <span className="text-sm">Webhook configurado (recomendado)</span>
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
                <li className="text-sm">Acesse o Dashboard do Stripe</li>
                <li className="text-sm">Vá em Developers → API keys</li>
                <li className="text-sm">Copie a Publishable key e a Secret key</li>
                <li className="text-sm">Cole as chaves nos campos acima</li>
                <li className="text-sm">Configure o webhook em Developers → Webhooks (opcional)</li>
                <li className="text-sm">Clique em "Conectar com Stripe"</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status da API Stripe</CardTitle>
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
                      <p className="font-medium">API Stripe</p>
                      <p className="text-sm text-gray-600">Gateway de pagamento internacional</p>
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
