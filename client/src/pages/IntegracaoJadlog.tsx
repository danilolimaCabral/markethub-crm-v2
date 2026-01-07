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
  Clock,
  MapPin,
  Package,
  Shield
} from "lucide-react";
import { toast } from 'sonner';

export default function IntegracaoJadlog() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const [credentials, setCredentials] = useState({
    cnpj: "",
    contrato: "",
    usuario: "",
    senha: ""
  });

  const handleConnect = async () => {
    if (!credentials.cnpj || !credentials.contrato || !credentials.usuario || !credentials.senha) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Aqui será implementada a lógica de conexão com Jadlog
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnected(true);
      toast.success("Conectado com sucesso!", {
        description: "Sua integração com Jadlog foi configurada.",
      });
    } catch (error) {
      toast.error("Erro ao conectar", {
        description: "Não foi possível conectar com a Jadlog. Verifique suas credenciais.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setCredentials({
      cnpj: "",
      contrato: "",
      usuario: "",
      senha: ""
    });
    toast.success("Desconectado", {
        description: "Sua integração com Jadlog foi desconectada.",
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integração Jadlog</h1>
            <p className="text-gray-600">Transportadora Jadlog</p>
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
                <CardTitle>Conectar Jadlog</CardTitle>
              </div>
              <CardDescription>
                Configure suas credenciais da Jadlog para cotação e rastreamento de envios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={credentials.cnpj}
                  onChange={(e) => setCredentials({ ...credentials, cnpj: e.target.value })}
                  disabled={connected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contrato">Número do Contrato *</Label>
                <Input
                  id="contrato"
                  type="text"
                  placeholder="Número do seu contrato"
                  value={credentials.contrato}
                  onChange={(e) => setCredentials({ ...credentials, contrato: e.target.value })}
                  disabled={connected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário *</Label>
                <Input
                  id="usuario"
                  type="text"
                  placeholder="Seu usuário"
                  value={credentials.usuario}
                  onChange={(e) => setCredentials({ ...credentials, usuario: e.target.value })}
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

              <div className="flex gap-3 pt-4">
                {!connected ? (
                  <Button 
                    onClick={handleConnect} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Conectando..." : "Conectar com Jadlog"}
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
                  href="https://www.jadlog.com.br/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Acessar Site Jadlog
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
                    <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Entregas rápidas e eficientes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Rastreamento em tempo real</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Package className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Cobertura nacional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Seguro de transporte incluso</span>
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
                    <span className="text-sm">Contrato ativo com Jadlog</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">2</span>
                    </div>
                    <span className="text-sm">CNPJ da empresa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-blue-600">3</span>
                    </div>
                    <span className="text-sm">Usuário e senha de acesso</span>
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
                <li className="text-sm">Entre em contato com a Jadlog para solicitar um contrato</li>
                <li className="text-sm">Aguarde a aprovação e receba suas credenciais</li>
                <li className="text-sm">Anote o número do contrato, usuário e senha</li>
                <li className="text-sm">Preencha os campos acima com suas credenciais</li>
                <li className="text-sm">Clique em "Conectar com Jadlog"</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status da API Jadlog</CardTitle>
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
                      <p className="font-medium">API Jadlog</p>
                      <p className="text-sm text-gray-600">Transportadora</p>
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
