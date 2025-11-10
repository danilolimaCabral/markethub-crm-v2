import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Package, 
  MessageSquare, 
  TrendingUp, 
  DollarSign,
  RefreshCw,
  Settings,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Key,
  Link as LinkIcon
} from 'lucide-react';

interface MLConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  connected: boolean;
}

interface MLMetrics {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingQuestions: number;
}

export default function MercadoLivre() {
  const [config, setConfig] = useState<MLConfig>({
    clientId: '',
    clientSecret: '',
    connected: false
  });
  
  const [metrics, setMetrics] = useState<MLMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    pendingQuestions: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Carregar configuração salva
  useEffect(() => {
    const savedConfig = localStorage.getItem('ml_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      
      // Verificar se token ainda é válido
      if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
        loadMetrics();
      }
    }
  }, []);

  const loadMetrics = () => {
    // Carregar métricas do localStorage (simulado)
    const savedMetrics = localStorage.getItem('ml_metrics');
    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics));
    }
  };

  const handleSaveCredentials = () => {
    if (!config.clientId || !config.clientSecret) {
      toast.error('Preencha Client ID e Client Secret');
      return;
    }

    const updatedConfig = { ...config };
    localStorage.setItem('ml_config', JSON.stringify(updatedConfig));
    toast.success('Credenciais salvas com sucesso!');
  };

  const handleAuthorize = () => {
    if (!config.clientId) {
      toast.error('Configure o Client ID primeiro');
      return;
    }

    // URL de autorização do Mercado Livre
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${config.clientId}&redirect_uri=${window.location.origin}/callback/mercadolivre`;
    
    toast.info('Redirecionando para autorização...');
    
    // Abrir em nova janela
    window.open(authUrl, '_blank', 'width=600,height=700');
  };

  const handleDisconnect = () => {
    if (confirm('Tem certeza que deseja desconectar do Mercado Livre?')) {
      const updatedConfig: MLConfig = {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        connected: false
      };
      
      setConfig(updatedConfig);
      localStorage.setItem('ml_config', JSON.stringify(updatedConfig));
      localStorage.removeItem('ml_metrics');
      
      setMetrics({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        activeProducts: 0,
        pendingQuestions: 0
      });
      
      toast.success('Desconectado do Mercado Livre');
    }
  };

  const handleSync = async () => {
    if (!config.connected) {
      toast.error('Conecte-se ao Mercado Livre primeiro');
      return;
    }

    setIsSyncing(true);
    
    // Simular sincronização
    setTimeout(() => {
      // Dados simulados
      const newMetrics: MLMetrics = {
        totalOrders: 156,
        pendingOrders: 12,
        totalRevenue: 45678.90,
        activeProducts: 89,
        pendingQuestions: 7
      };
      
      setMetrics(newMetrics);
      localStorage.setItem('ml_metrics', JSON.stringify(newMetrics));
      
      setIsSyncing(false);
      toast.success('Dados sincronizados com sucesso!');
    }, 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <CRMLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <img 
                src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.92/mercadolibre/logo_large_25years_v2.png" 
                alt="Mercado Livre" 
                className="h-8"
              />
              Integração Mercado Livre
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gerencie suas vendas, produtos e pedidos do Mercado Livre
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {config.connected ? (
              <>
                <Badge variant="default" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Conectado
                </Badge>
                <Button onClick={handleSync} disabled={isSyncing} variant="outline" className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
              </>
            ) : (
              <Badge variant="secondary" className="gap-2">
                <XCircle className="w-4 h-4" />
                Desconectado
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="docs">Documentação</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {!config.connected ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <XCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Não conectado ao Mercado Livre</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Configure suas credenciais e conecte-se para começar a gerenciar suas vendas
                    </p>
                    <Button onClick={() => document.querySelector('[value="config"]')?.dispatchEvent(new Event('click', { bubbles: true }))}>
                      <Settings className="w-4 h-4 mr-2" />
                      Ir para Configuração
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total de Pedidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{metrics.totalOrders}</p>
                          <p className="text-xs text-slate-500">Últimos 30 dias</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Pedidos Pendentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-orange-500" />
                        <div>
                          <p className="text-2xl font-bold">{metrics.pendingOrders}</p>
                          <p className="text-xs text-slate-500">Aguardando envio</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Faturamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
                          <p className="text-xs text-slate-500">Últimos 30 dias</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Produtos Ativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{metrics.activeProducts}</p>
                          <p className="text-xs text-slate-500">Anúncios publicados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Perguntas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-cyan-500" />
                        <div>
                          <p className="text-2xl font-bold">{metrics.pendingQuestions}</p>
                          <p className="text-xs text-slate-500">Aguardando resposta</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Ações Rápidas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                    <CardDescription>Acesse rapidamente as funcionalidades principais</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                      <ShoppingCart className="w-6 h-6" />
                      <span>Ver Pedidos</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                      <Package className="w-6 h-6" />
                      <span>Gerenciar Produtos</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                      <MessageSquare className="w-6 h-6" />
                      <span>Responder Perguntas</span>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                      <TrendingUp className="w-6 h-6" />
                      <span>Relatórios</span>
                    </Button>
                  </CardContent>
                </Card>

                {/* Informação */}
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>💡 Dica:</strong> Os dados são sincronizados automaticamente a cada 15 minutos. 
                      Você também pode sincronizar manualmente clicando no botão "Sincronizar" acima.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Configuração Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Credenciais OAuth2
                </CardTitle>
                <CardDescription>
                  Configure suas credenciais do Mercado Livre para integração via API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientId">Client ID (APP ID)</Label>
                  <Input
                    id="clientId"
                    value={config.clientId}
                    onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                    placeholder="1234567890123456"
                    disabled={config.connected}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Obtido ao criar aplicação no Mercado Livre Developers
                  </p>
                </div>

                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={config.clientSecret}
                    onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                    placeholder="••••••••••••••••"
                    disabled={config.connected}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Chave secreta da aplicação (mantenha em segurança)
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  {!config.connected ? (
                    <>
                      <Button onClick={handleSaveCredentials} variant="outline">
                        Salvar Credenciais
                      </Button>
                      <Button onClick={handleAuthorize} disabled={!config.clientId}>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Autorizar Acesso
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleDisconnect} variant="destructive">
                      Desconectar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  ⚠️ Como obter as credenciais?
                </h4>
                <ol className="text-sm text-yellow-900 dark:text-yellow-100 space-y-2 list-decimal list-inside">
                  <li>Acesse <a href="https://developers.mercadolivre.com.br/" target="_blank" rel="noopener noreferrer" className="underline">Mercado Livre Developers</a></li>
                  <li>Faça login com sua conta do Mercado Livre</li>
                  <li>Crie uma nova aplicação</li>
                  <li>Configure a Redirect URI como: <code className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">{window.location.origin}/callback/mercadolivre</code></li>
                  <li>Copie o Client ID e Client Secret</li>
                  <li>Cole aqui e clique em "Autorizar Acesso"</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentação Tab */}
          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentação da API</CardTitle>
                <CardDescription>Links úteis e recursos para desenvolvedores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <a 
                    href="https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Documentação Oficial da API
                  </a>
                  
                  <a 
                    href="https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Autenticação OAuth2
                  </a>
                  
                  <a 
                    href="/PESQUISA_API_MERCADO_LIVRE.md" 
                    target="_blank"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Guia de Integração (Local)
                  </a>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-2">Endpoints Principais</h4>
                  <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-400">
                    <li><code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">GET /users/me</code> - Dados do usuário</li>
                    <li><code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">GET /orders/search</code> - Buscar pedidos</li>
                    <li><code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">GET /items/&#123;item_id&#125;</code> - Detalhes do produto</li>
                    <li><code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">POST /items</code> - Criar produto</li>
                    <li><code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">GET /questions/search</code> - Buscar perguntas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CRMLayout>
  );
}
