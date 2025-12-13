import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ShoppingCart,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Info,
  Key,
  Settings,
  Activity
} from "lucide-react";

export default function IntegracaoMagalu() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    if (!clientId || !clientSecret || !sellerId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar chamada real à API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Conectado com sucesso ao Magazine Luiza!");
      setConnected(true);
    } catch (error) {
      toast.error("Erro ao conectar com Magazine Luiza");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            Integração Magazine Luiza
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas vendas, produtos e pedidos do Magalu Marketplace
          </p>
        </div>
        {connected && (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Conectada
          </Badge>
        )}
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="monitor">Monitoramento API</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          {/* Conectar Magalu */}
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Conectar Magalu Marketplace</h2>
                <p className="text-sm text-gray-600">
                  Configure suas credenciais da API do Magazine Luiza para sincronizar automaticamente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Benefícios */}
              <Card className="p-4 bg-green-50 border-green-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Benefícios
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Sincronização automática de produtos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Gestão centralizada de pedidos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Atualização automática de estoque</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Integração com Magalu Entregas</span>
                  </li>
                </ul>
              </Card>

              {/* Requisitos */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Requisitos
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Conta ativa no Magalu Marketplace</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Acesso ao Portal do Vendedor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Client ID e Client Secret</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Seller ID da sua loja</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Formulário */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  type="text"
                  placeholder="Digite seu Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={connected}
                />
              </div>

              <div>
                <Label htmlFor="clientSecret">Client Secret *</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Digite seu Client Secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  disabled={connected}
                />
              </div>

              <div>
                <Label htmlFor="sellerId">Seller ID *</Label>
                <Input
                  id="sellerId"
                  type="text"
                  placeholder="Digite o ID do vendedor"
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  disabled={connected}
                />
              </div>

              <div className="flex gap-3 pt-4">
                {!connected ? (
                  <Button
                    onClick={handleConnect}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {loading ? "Conectando..." : "Conectar com Magalu"}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => setConnected(false)}
                  >
                    Desconectar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.open("https://parceiro.magazineluiza.com.br/", "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Portal do Vendedor
                </Button>
              </div>
            </div>
          </Card>

          {/* Como obter credenciais */}
          <Card className="p-6 bg-gray-50">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Como obter suas credenciais
            </h3>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>Acesse o <a href="https://parceiro.magazineluiza.com.br/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Portal do Vendedor Magalu</a></li>
              <li>Faça login com sua conta de vendedor</li>
              <li>Vá em "Configurações" → "Integrações"</li>
              <li>Solicite acesso à API se ainda não tiver</li>
              <li>Copie o Client ID, Client Secret e Seller ID</li>
              <li>Cole as credenciais nos campos acima e clique em "Conectar"</li>
            </ol>
          </Card>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Status da API Magalu</h2>
            </div>
            <div className="text-center py-12 text-gray-500">
              <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Configure a integração primeiro para ver o monitoramento</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
