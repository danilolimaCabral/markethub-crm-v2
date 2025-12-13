import CRMLayout from "@/components/CRMLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  Clock,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Truck,
  CreditCard,
  Database,
  Zap,
  BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface APIStatus {
  name: string;
  category: 'internal' | 'marketplace' | 'payment' | 'logistics' | 'other';
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  responseTime?: number;
  lastCheck?: string;
  uptime?: number;
  errorRate?: number;
  requestsToday?: number;
  icon: React.ReactNode;
  description: string;
  endpoint?: string;
  errorMessage?: string;
  errorDetails?: string;
}

interface APIMonitoringData {
  timestamp: string;
  summary: {
    total: number;
    online: number;
    offline: number;
    degraded: number;
  };
  apis: APIStatus[];
}

export default function MonitoramentoAPIs() {
  const [data, setData] = useState<APIMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedAPI, setSelectedAPI] = useState<APIStatus | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Carregar status das APIs
  const carregarStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('markethub_token');
      const response = await fetch('/api/monitoring/apis', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar status das APIs');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      toast.error('Erro ao carregar status das APIs');
      
      // Dados mockados para desenvolvimento
      setData({
        timestamp: new Date().toISOString(),
        summary: {
          total: 16,
          online: 12,
          offline: 2,
          degraded: 2
        },
        apis: [
          // APIs Internas
          {
            name: 'API de Pedidos',
            category: 'internal',
            status: 'online',
            responseTime: 45,
            uptime: 99.9,
            errorRate: 0.1,
            requestsToday: 1250,
            icon: <ShoppingCart className="w-5 h-5" />,
            description: 'Gerenciamento de pedidos do sistema',
            endpoint: '/api/pedidos'
          },
          {
            name: 'API de Produtos',
            category: 'internal',
            status: 'online',
            responseTime: 38,
            uptime: 99.8,
            errorRate: 0.2,
            requestsToday: 890,
            icon: <Package className="w-5 h-5" />,
            description: 'Catálogo e gestão de produtos',
            endpoint: '/api/produtos'
          },
          {
            name: 'API de Clientes',
            category: 'internal',
            status: 'online',
            responseTime: 52,
            uptime: 99.7,
            errorRate: 0.3,
            requestsToday: 650,
            icon: <Users className="w-5 h-5" />,
            description: 'Gestão de clientes e contatos',
            endpoint: '/api/clientes'
          },
          {
            name: 'API Financeira',
            category: 'internal',
            status: 'degraded',
            responseTime: 320,
            uptime: 98.5,
            errorRate: 1.5,
            requestsToday: 420,
            icon: <DollarSign className="w-5 h-5" />,
            description: 'Transações e relatórios financeiros',
            endpoint: '/api/financial'
          },
          
          // APIs de Marketplaces
          {
            name: 'Mercado Livre API',
            category: 'marketplace',
            status: 'online',
            responseTime: 180,
            uptime: 99.5,
            errorRate: 0.5,
            requestsToday: 340,
            icon: <ShoppingCart className="w-5 h-5 text-yellow-500" />,
            description: 'Integração com Mercado Livre',
            endpoint: '/api/integrations/mercadolivre'
          },
          {
            name: 'Shopee API',
            category: 'marketplace',
            status: 'offline',
            responseTime: 0,
            uptime: 0,
            errorRate: 100,
            requestsToday: 0,
            icon: <ShoppingCart className="w-5 h-5 text-orange-500" />,
            description: 'Integração com Shopee',
            endpoint: '/api/integrations/shopee'
          },
          {
            name: 'Amazon API',
            category: 'marketplace',
            status: 'offline',
            responseTime: 0,
            uptime: 0,
            errorRate: 100,
            requestsToday: 0,
            icon: <ShoppingCart className="w-5 h-5 text-orange-600" />,
            description: 'Integração com Amazon',
            endpoint: '/api/integrations/amazon'
          },
          {
            name: 'Magalu API',
            category: 'marketplace',
            status: 'unknown',
            responseTime: 0,
            uptime: 0,
            errorRate: 0,
            requestsToday: 0,
            icon: <ShoppingCart className="w-5 h-5 text-blue-500" />,
            description: 'Integração com Magazine Luiza',
            endpoint: '/api/integrations/magalu'
          },
          
          // APIs de Pagamento
          {
            name: 'Stripe API',
            category: 'payment',
            status: 'online',
            responseTime: 95,
            uptime: 99.9,
            errorRate: 0.1,
            requestsToday: 180,
            icon: <CreditCard className="w-5 h-5 text-purple-500" />,
            description: 'Processamento de pagamentos',
            endpoint: '/api/payments/stripe'
          },
          {
            name: 'Mercado Pago API',
            category: 'payment',
            status: 'online',
            responseTime: 120,
            uptime: 99.6,
            errorRate: 0.4,
            requestsToday: 95,
            icon: <CreditCard className="w-5 h-5 text-blue-400" />,
            description: 'Gateway de pagamento ML',
            endpoint: '/api/payments/mercadopago'
          },
          {
            name: 'PagSeguro API',
            category: 'payment',
            status: 'degraded',
            responseTime: 450,
            uptime: 97.8,
            errorRate: 2.2,
            requestsToday: 45,
            icon: <CreditCard className="w-5 h-5 text-green-500" />,
            description: 'Gateway de pagamento PagSeguro',
            endpoint: '/api/payments/pagseguro'
          },
          
          // APIs de Logística
          {
            name: 'Correios API',
            category: 'logistics',
            status: 'online',
            responseTime: 280,
            uptime: 98.5,
            errorRate: 1.5,
            requestsToday: 320,
            icon: <Truck className="w-5 h-5 text-yellow-600" />,
            description: 'Rastreamento e cálculo de frete',
            endpoint: '/api/logistics/correios'
          },
          {
            name: 'Melhor Envio API',
            category: 'logistics',
            status: 'online',
            responseTime: 150,
            uptime: 99.2,
            errorRate: 0.8,
            requestsToday: 210,
            icon: <Truck className="w-5 h-5 text-blue-600" />,
            description: 'Cotação e envio de encomendas',
            endpoint: '/api/logistics/melhorenvio'
          },
          {
            name: 'Jadlog API',
            category: 'logistics',
            status: 'online',
            responseTime: 190,
            uptime: 98.9,
            errorRate: 1.1,
            requestsToday: 85,
            icon: <Truck className="w-5 h-5 text-red-600" />,
            description: 'Transportadora Jadlog',
            endpoint: '/api/logistics/jadlog'
          },
          
          // Outras APIs
          {
            name: 'Database API',
            category: 'other',
            status: 'online',
            responseTime: 12,
            uptime: 99.99,
            errorRate: 0.01,
            requestsToday: 8500,
            icon: <Database className="w-5 h-5 text-slate-600" />,
            description: 'Conexão com banco de dados',
            endpoint: 'internal'
          },
          {
            name: 'Cache API',
            category: 'other',
            status: 'online',
            responseTime: 3,
            uptime: 99.95,
            errorRate: 0.05,
            requestsToday: 12000,
            icon: <Zap className="w-5 h-5 text-yellow-500" />,
            description: 'Sistema de cache Redis',
            endpoint: 'internal'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarStatus();
    
    // Auto-refresh a cada 30 segundos
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        carregarStatus();
      }, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'degraded': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge variant="default" className="bg-green-600">Online</Badge>;
      case 'offline': return <Badge variant="destructive">Offline</Badge>;
      case 'degraded': return <Badge variant="secondary" className="bg-yellow-600 text-white">Degradado</Badge>;
      default: return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'internal': return 'APIs Internas';
      case 'marketplace': return 'Marketplaces';
      case 'payment': return 'Pagamentos';
      case 'logistics': return 'Logística';
      case 'other': return 'Infraestrutura';
      default: return 'Outros';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'internal': return <Activity className="w-5 h-5" />;
      case 'marketplace': return <ShoppingCart className="w-5 h-5" />;
      case 'payment': return <CreditCard className="w-5 h-5" />;
      case 'logistics': return <Truck className="w-5 h-5" />;
      case 'other': return <Database className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const groupedAPIs = data?.apis.reduce((acc, api) => {
    if (!acc[api.category]) {
      acc[api.category] = [];
    }
    acc[api.category].push(api);
    return acc;
  }, {} as Record<string, APIStatus[]>);

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary" />
              Monitoramento de APIs
            </h1>
            <p className="text-muted-foreground mt-1">
              Status em tempo real de todas as integrações e APIs do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Button 
              onClick={carregarStatus} 
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Resumo */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de APIs</p>
                    <p className="text-3xl font-bold">{data.summary.total}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Online</p>
                    <p className="text-3xl font-bold text-green-600">{data.summary.online}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Degradadas</p>
                    <p className="text-3xl font-bold text-yellow-600">{data.summary.degraded}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Offline</p>
                    <p className="text-3xl font-bold text-red-600">{data.summary.offline}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de APIs por Categoria */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground">Carregando status das APIs...</p>
            </div>
          </div>
        ) : groupedAPIs ? (
          <div className="space-y-6">
            {Object.entries(groupedAPIs).map(([category, apis]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {getCategoryName(category)}
                    <Badge variant="outline" className="ml-auto">{apis.length} APIs</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apis.map((api, index) => (
                      <div 
                        key={index}
                        onClick={() => {
                          setSelectedAPI(api);
                          setDetailsOpen(true);
                        }}
                        className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer space-y-3"
                      >
                        {/* Header do Card */}
                        <div className="flex items-center gap-4">
                          <div className={getStatusColor(api.status)}>
                            {api.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{api.name}</h4>
                              {getStatusBadge(api.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{api.description}</p>
                            {api.endpoint && (
                              <p className="text-xs text-muted-foreground font-mono mt-1">{api.endpoint}</p>
                            )}
                          </div>
                        </div>

                        {/* Métricas em Grid - Oculto em mobile, visível em tablet+ */}
                        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t border-border">
                          {api.responseTime !== undefined && (
                            <div className="p-2 bg-muted/50 rounded">
                              <p className="text-muted-foreground text-[10px] mb-0.5 truncate">Tempo</p>
                              <p className="font-semibold text-xs">{api.responseTime}ms</p>
                            </div>
                          )}
                          {api.uptime !== undefined && (
                            <div className="p-2 bg-muted/50 rounded">
                              <p className="text-muted-foreground text-[10px] mb-0.5 truncate">Uptime</p>
                              <p className="font-semibold text-xs">{api.uptime.toFixed(1)}%</p>
                            </div>
                          )}
                          {api.requestsToday !== undefined && (
                            <div className="p-2 bg-muted/50 rounded">
                              <p className="text-muted-foreground text-[10px] mb-0.5 truncate">Req.</p>
                              <p className="font-semibold text-xs">{api.requestsToday.toLocaleString()}</p>
                            </div>
                          )}
                          {api.errorRate !== undefined && (
                            <div className="p-2 bg-muted/50 rounded">
                              <p className="text-muted-foreground text-[10px] mb-0.5 truncate">Erro</p>
                              <p className={`font-semibold text-xs ${api.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                                {api.errorRate.toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Hint para mobile */}
                        <div className="sm:hidden pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground text-center">Clique para ver detalhes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12">
            <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
            <p className="text-muted-foreground">Não foi possível carregar o status das APIs</p>
          </div>
        )}

        {/* Última Atualização */}
        {data && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Última atualização: {new Date(data.timestamp).toLocaleString('pt-BR')}</span>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da API */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedAPI && (
                <>
                  <div className={getStatusColor(selectedAPI.status)}>
                    {selectedAPI.icon}
                  </div>
                  <span>{selectedAPI.name}</span>
                  {getStatusBadge(selectedAPI.status)}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAPI?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedAPI && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    {selectedAPI.status === 'online' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {selectedAPI.status === 'offline' && <XCircle className="w-4 h-4 text-red-500" />}
                    {selectedAPI.status === 'degraded' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    <span className="font-semibold capitalize">{selectedAPI.status}</span>
                  </div>
                </div>

                {selectedAPI.endpoint && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Endpoint</p>
                    <p className="font-mono text-sm font-semibold">{selectedAPI.endpoint}</p>
                  </div>
                )}
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedAPI.responseTime !== undefined && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Tempo de Resposta</p>
                    <p className="text-2xl font-bold">{selectedAPI.responseTime}ms</p>
                  </div>
                )}
                {selectedAPI.uptime !== undefined && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                    <p className="text-2xl font-bold">{selectedAPI.uptime.toFixed(1)}%</p>
                  </div>
                )}
                {selectedAPI.requestsToday !== undefined && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Requisições Hoje</p>
                    <p className="text-2xl font-bold">{selectedAPI.requestsToday.toLocaleString()}</p>
                  </div>
                )}
                {selectedAPI.errorRate !== undefined && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Taxa de Erro</p>
                    <p className={`text-2xl font-bold ${selectedAPI.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedAPI.errorRate.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Detalhes do Erro (se offline/degraded) */}
              {(selectedAPI.status === 'offline' || selectedAPI.status === 'degraded') && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        {selectedAPI.status === 'offline' ? 'API Offline' : 'API Degradada'}
                      </h4>
                      <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                        {selectedAPI.errorMessage || getDefaultErrorMessage(selectedAPI)}
                      </p>
                      {selectedAPI.errorDetails && (
                        <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs font-mono text-red-900 dark:text-red-100">
                          {selectedAPI.errorDetails}
                        </div>
                      )}
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">Possíveis Causas:</p>
                        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                          {getPossibleCauses(selectedAPI).map((cause, idx) => (
                            <li key={idx}>{cause}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">Ações Recomendadas:</p>
                        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                          {getRecommendedActions(selectedAPI).map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-between items-center gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Fechar
                </Button>
                
                <div className="flex gap-2">
                  {getActionButtons(selectedAPI).map((button, idx) => (
                    <Button 
                      key={idx}
                      variant={button.variant as any}
                      onClick={() => {
                        button.onClick();
                        setDetailsOpen(false);
                      }}
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CRMLayout>
  );
}

// Funções auxiliares para mensagens de erro
function getDefaultErrorMessage(api: APIStatus): string {
  if (api.status === 'offline') {
    if (api.category === 'marketplace') {
      return 'A integração com este marketplace não está configurada ou a autorização expirou.';
    } else if (api.category === 'payment') {
      return 'O gateway de pagamento não está configurado ou as credenciais são inválidas.';
    } else if (api.category === 'logistics') {
      return 'O serviço de logística não está disponível ou não foi configurado.';
    } else {
      return 'A API não está respondendo. Pode haver um problema de conexão ou o serviço está indisponível.';
    }
  }
  return 'A API está apresentando problemas de desempenho ou instabilidade.';
}

function getPossibleCauses(api: APIStatus): string[] {
  const causes: string[] = [];
  
  if (api.category === 'marketplace') {
    causes.push('Token de autorização expirado');
    causes.push('Integração não configurada');
    causes.push('Credenciais inválidas');
    causes.push('API do marketplace fora do ar');
  } else if (api.category === 'internal') {
    causes.push('Erro de conexão com o banco de dados');
    causes.push('Serviço em manutenção');
    causes.push('Sobrecarga do servidor');
  } else if (api.category === 'payment') {
    causes.push('Credenciais de pagamento não configuradas');
    causes.push('Gateway de pagamento indisponível');
    causes.push('Conta suspensa ou inativa');
  } else if (api.category === 'logistics') {
    causes.push('API de logística não configurada');
    causes.push('Serviço de entrega indisponível');
    causes.push('Credenciais inválidas');
  } else {
    causes.push('Problema de conexão de rede');
    causes.push('Serviço temporariamente indisponível');
  }
  
  return causes;
}

function getRecommendedActions(api: APIStatus): string[] {
  const actions: string[] = [];
  
  if (api.category === 'marketplace') {
    actions.push('Verifique se a integração está autorizada');
    actions.push('Reconecte a conta do marketplace');
    actions.push('Verifique as permissões do aplicativo');
  } else if (api.category === 'internal') {
    actions.push('Verifique os logs do servidor');
    actions.push('Teste a conexão com o banco de dados');
    actions.push('Entre em contato com o suporte técnico');
  } else if (api.category === 'payment') {
    actions.push('Configure as credenciais de pagamento');
    actions.push('Verifique o status da sua conta');
    actions.push('Teste a conexão com o gateway');
  } else if (api.category === 'logistics') {
    actions.push('Configure a integração de logística');
    actions.push('Verifique as credenciais de acesso');
    actions.push('Teste a conexão com o serviço');
  } else {
    actions.push('Aguarde alguns minutos e tente novamente');
    actions.push('Verifique sua conexão com a internet');
    actions.push('Entre em contato com o suporte se o problema persistir');
  }
  
  return actions;
}

function getActionButtons(api: APIStatus): Array<{label: string, variant: string, onClick: () => void}> {
  const buttons: Array<{label: string, variant: string, onClick: () => void}> = [];
  
  // Botões apenas para APIs offline ou degradadas
  if (api.status === 'offline' || api.status === 'degraded') {
    if (api.category === 'marketplace') {
      // Mercado Livre
      if (api.name.includes('Mercado Livre')) {
        buttons.push({
          label: 'Conectar Mercado Livre',
          variant: 'default',
          onClick: () => {
            window.location.href = '/integracoes/mercadolivre';
          }
        });
      }
      // Shopee
      else if (api.name.includes('Shopee')) {
        buttons.push({
          label: 'Configurar Shopee',
          variant: 'default',
          onClick: () => {
            toast.info('Integração com Shopee em desenvolvimento');
          }
        });
      }
      // Amazon
      else if (api.name.includes('Amazon')) {
        buttons.push({
          label: 'Configurar Amazon',
          variant: 'default',
          onClick: () => {
            toast.info('Integração com Amazon em desenvolvimento');
          }
        });
      }
      // Magalu
      else if (api.name.includes('Magalu')) {
        buttons.push({
          label: 'Configurar Magalu',
          variant: 'default',
          onClick: () => {
            toast.info('Integração com Magalu planejada');
          }
        });
      }
    } else if (api.category === 'payment') {
      buttons.push({
        label: 'Configurar Pagamento',
        variant: 'default',
        onClick: () => {
          window.location.href = '/configuracoes';
        }
      });
    } else if (api.category === 'logistics') {
      buttons.push({
        label: 'Configurar Logística',
        variant: 'default',
        onClick: () => {
          window.location.href = '/configuracoes';
        }
      });
    } else if (api.category === 'internal') {
      buttons.push({
        label: 'Ver Logs',
        variant: 'outline',
        onClick: () => {
          toast.info('Visualização de logs em desenvolvimento');
        }
      });
      buttons.push({
        label: 'Contatar Suporte',
        variant: 'default',
        onClick: () => {
          window.open('https://help.manus.im', '_blank');
        }
      });
    }
  } else if (api.status === 'online') {
    // Botões para APIs online
    if (api.category === 'marketplace') {
      buttons.push({
        label: 'Ver Integração',
        variant: 'outline',
        onClick: () => {
          if (api.name.includes('Mercado Livre')) {
            window.location.href = '/integracoes/mercadolivre';
          } else {
            toast.info('Página de integração em desenvolvimento');
          }
        }
      });
    }
  }
  
  return buttons;
}
