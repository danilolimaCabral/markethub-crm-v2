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
  Package,
  MapPin,
  Calculator,
  Clock
} from "lucide-react";
import { toast } from 'sonner';

export default function IntegracaoCorreios() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const [credentials, setCredentials] = useState({
    codigoAdministrativo: "",
    senha: "",
    cartaoPostagem: "",
    cnpj: ""
  });

  const handleConnect = async () => {
    if (!credentials.codigoAdministrativo || !credentials.senha) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha o código administrativo e senha.",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Aqui será implementada a lógica de conexão com Correios
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnected(true);
      toast.success("Conectado com sucesso!", {
        description: "Sua integração com Correios foi configurada.",
      });
    } catch (error) {
      toast.error("Erro ao conectar", {
        description: "Não foi possível conectar com os Correios. Verifique suas credenciais.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setCredentials({
      codigoAdministrativo: "",
      senha: "",
      cartaoPostagem: "",
      cnpj: ""
    });
    toast.success("Desconectado", {
      description: "Sua integração com Correios foi desconectada.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integração Correios</h1>
            <p className="text-gray-600">Cálculo de frete e rastreamento de encomendas</p>
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
                <CardTitle>Conectar Correios</CardTitle>
              </div>
              <CardDescription>
                Configure suas credenciais dos Correios para cálculo de frete e rastreamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigoAdministrativo">Código Administrativo *</Label>
                <Input
                  id="codigoAdministrativo"
                  type="text"
                  placeholder="Seu código administrativo"
                  value={credentials.codigoAdministrativo}
                  onChange={(e) => setCredentials({ ...credentials, codigoAdministrativo: e.target.value })}
                  disabled={connected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha *</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Sua senha"
                  value={credentials.senha}
                  onChange={(e) => setCredentials({ ...credentials, senha: e.target.value })}
                  disabled={connected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartaoPostagem">Cartão de Postagem (Opcional)</Label>
                <Input
                  id="cartaoPostagem"
                  type="text"
                  placeholder="Número do cartão de postagem"
                  value={credentials.cartaoPostagem}
                  onChange={(e) => setCredentials({ ...credentials, cartaoPostagem: e.target.value })}
                  disabled={connected}
                />
                <p className="text-sm text-gray-500">
                  Necessário para cálculo de frete com desconto
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={credentials.cnpj}
                  onChange={(e) => setCredentials({ ...credentials, cnpj: e.target.value })}
                  disabled={connected}
                />
              </div>

              <div className="flex gap-3 pt-4">
                {!connected ? (
                  <Button 
                    onClick={handleConnect} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Conectando..." : "Conectar com Correios"}
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
                  href="https://www.correios.com.br/enviar/precisa-de-ajuda/contrato-nacional" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Solicitar Contrato com Correios
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
                    <Calculator className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Cálculo automático de frete (PAC, SEDEX)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Rastreamento de encomendas em tempo real</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Package className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Cobertura nacional garantida</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Prazo de entrega estimado</span>
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
                    <span className="text-sm">Contrato com Correios</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">2</span>
                    </div>
                    <span className="text-sm">Código administrativo e senha</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">3</span>
                    </div>
                    <span className="text-sm">Cartão de postagem (para descontos)</span>
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
                <li className="text-sm">Solicite um contrato com os Correios</li>
                <li className="text-sm">Obtenha seu código administrativo e senha</li>
                <li className="text-sm">Se tiver cartão de postagem, anote o número</li>
                <li className="text-sm">Preencha os campos acima com suas credenciais</li>
                <li className="text-sm">Clique em "Conectar com Correios"</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status da API Correios</CardTitle>
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
                      <p className="font-medium">API Correios</p>
                      <p className="text-sm text-gray-600">Cálculo de frete e rastreamento</p>
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
