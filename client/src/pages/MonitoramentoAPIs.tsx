import CRMLayout from "@/components/CRMLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
                        className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors gap-4"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={getStatusColor(api.status)}>
                            {api.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{api.name}</h4>
                              {getStatusBadge(api.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{api.description}</p>
                            {api.endpoint && (
                              <p className="text-xs text-muted-foreground font-mono mt-1">{api.endpoint}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 lg:gap-6 text-sm flex-wrap lg:flex-nowrap">
                          {api.responseTime !== undefined && (
                            <div className="text-center min-w-[100px]">
                              <p className="text-muted-foreground text-xs whitespace-nowrap">Tempo de Resposta</p>
                              <p className="font-semibold">{api.responseTime}ms</p>
                            </div>
                          )}
                          {api.uptime !== undefined && (
                            <div className="text-center min-w-[80px]">
                              <p className="text-muted-foreground text-xs">Uptime</p>
                              <p className="font-semibold">{api.uptime.toFixed(1)}%</p>
                            </div>
                          )}
                          {api.requestsToday !== undefined && (
                            <div className="text-center min-w-[100px]">
                              <p className="text-muted-foreground text-xs whitespace-nowrap">Requisições Hoje</p>
                              <p className="font-semibold">{api.requestsToday.toLocaleString()}</p>
                            </div>
                          )}
                          {api.errorRate !== undefined && (
                            <div className="text-center min-w-[90px]">
                              <p className="text-muted-foreground text-xs whitespace-nowrap">Taxa de Erro</p>
                              <p className={`font-semibold ${api.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                                {api.errorRate.toFixed(1)}%
                              </p>
                            </div>
                          )}
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
    </CRMLayout>
  );
}
