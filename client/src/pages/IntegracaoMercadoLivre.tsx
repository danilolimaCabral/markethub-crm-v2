import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Link as LinkIcon,
  AlertCircle,
  Calendar,
  Eye,
} from 'lucide-react';
import axios from 'axios';

interface Integration {
  id: number;
  mlUserId: string;
  lastSync: string | null;
  userInfo: {
    nickname: string;
    email: string;
    permalink: string;
  };
}

interface MLProduct {
  id: number;
  mlItemId: string;
  title: string;
  price: number;
  availableQuantity: number;
  soldQuantity: number;
  status: 'active' | 'paused' | 'closed';
  permalink: string;
  thumbnail: string | null;
  lastSyncAt: string;
}

interface MLOrder {
  id: number;
  mlOrderId: string;
  status: string;
  dateCreated: string;
  dateClosed: string | null;
  totalAmount: number;
  paidAmount: number;
  buyerNickname: string | null;
  items: any[];
}

interface Stats {
  products: number;
  orders: {
    total: number;
    paid: number;
    pending: number;
    cancelled: number;
    totalRevenue: number;
  };
}

export default function IntegracaoMercadoLivre() {
  const [connected, setConnected] = useState(false);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<MLProduct[]>([]);
  const [orders, setOrders] = useState<MLOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/integrations/mercadolivre/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.connected) {
        setConnected(true);
        setIntegration(response.data.integration);
        await loadStats();
        await loadProducts();
        await loadOrders();
      }
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await axios.get('/api/integrations/mercadolivre/auth', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Redireciona para autorização do Mercado Livre
      window.location.href = response.data.authUrl;
    } catch (error: any) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao iniciar conexão com Mercado Livre');
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.post(
        '/api/integrations/mercadolivre/disconnect',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setConnected(false);
      setIntegration(null);
      setStats(null);
      setProducts([]);
      setOrders([]);
      toast.success('Desconectado do Mercado Livre');
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar');
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/integrations/mercadolivre/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setStats(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get('/api/integrations/mercadolivre/products', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setProducts(response.data.products);
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get('/api/integrations/mercadolivre/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setOrders(response.data.orders);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const handleSyncProducts = async () => {
    try {
      setIsSyncing(true);
      const response = await axios.post(
        '/api/integrations/mercadolivre/sync/products',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      toast.success(
        `Produtos sincronizados! ${response.data.result.imported} novos, ${response.data.result.updated} atualizados`
      );
      await loadProducts();
      await loadStats();
    } catch (error: any) {
      console.error('Erro ao sincronizar produtos:', error);
      toast.error('Erro ao sincronizar produtos');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncOrders = async () => {
    try {
      setIsSyncing(true);
      const response = await axios.post(
        '/api/integrations/mercadolivre/sync/orders',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      toast.success(
        `Pedidos sincronizados! ${response.data.result.imported} novos, ${response.data.result.updated} atualizados`
      );
      await loadOrders();
      await loadStats();
    } catch (error: any) {
      console.error('Erro ao sincronizar pedidos:', error);
      toast.error('Erro ao sincronizar pedidos');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Ativo', variant: 'default' },
      paused: { label: 'Pausado', variant: 'secondary' },
      closed: { label: 'Fechado', variant: 'destructive' },
      paid: { label: 'Pago', variant: 'default' },
      confirmed: { label: 'Confirmado', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      payment_required: { label: 'Aguardando Pagamento', variant: 'outline' },
      payment_in_process: { label: 'Processando Pagamento', variant: 'secondary' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      
    );
  }

  if (!connected) {
    return (
      
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Integração Mercado Livre</h1>
            <p className="text-muted-foreground">Conecte sua conta do Mercado Livre ao Markthub CRM</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Conectar Mercado Livre
              </CardTitle>
              <CardDescription>
                Sincronize seus produtos e pedidos do Mercado Livre automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                    <CardTitle className="text-lg">Benefícios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Sincronização automática de produtos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Gestão centralizada de pedidos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Atualização automática de estoque</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Cálculo automático de taxas</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <AlertCircle className="h-8 w-8 text-blue-500 mb-2" />
                    <CardTitle className="text-lg">Requisitos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>Conta ativa no Mercado Livre</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>Permissão de administrador</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>Produtos publicados</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleConnect} className="gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Conectar com Mercado Livre
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      
    );
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mercado Livre</h1>
            <p className="text-muted-foreground">
              Conectado como <strong>{integration?.userInfo.nickname}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <XCircle className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.products}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.orders.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.orders.paid} pagos, {stats.orders.pending} pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.orders.totalRevenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {integration?.lastSync ? formatDate(integration.lastSync) : 'Nunca'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Produtos Sincronizados</h2>
              <Button onClick={handleSyncProducts} disabled={isSyncing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sincronizar Produtos
              </Button>
            </div>

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{product.title}</h3>
                          <p className="text-sm text-muted-foreground">ID: {product.mlItemId}</p>
                        </div>
                        {getStatusBadge(product.status)}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>Preço: {formatCurrency(product.price)}</span>
                        <span>Estoque: {product.availableQuantity}</span>
                        <span>Vendidos: {product.soldQuantity}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={product.permalink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {products.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum produto sincronizado ainda</p>
                    <Button onClick={handleSyncProducts} className="mt-4">
                      Sincronizar Agora
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pedidos Sincronizados</h2>
              <Button onClick={handleSyncOrders} disabled={isSyncing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sincronizar Pedidos
              </Button>
            </div>

            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">Pedido #{order.mlOrderId}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.buyerNickname || 'Comprador'}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span>Total: {formatCurrency(order.totalAmount)}</span>
                      <span>Data: {formatDate(order.dateCreated)}</span>
                      <span>Itens: {order.items.length}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {orders.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum pedido sincronizado ainda</p>
                    <Button onClick={handleSyncOrders} className="mt-4">
                      Sincronizar Agora
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}
