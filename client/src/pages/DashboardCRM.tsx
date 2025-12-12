import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ShoppingCart, Package, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CurrencyWidget from '@/components/CurrencyWidget';
import SyncIndicator from '@/components/SyncIndicator';
import DashboardFinanceiro from '@/components/DashboardFinanceiro';

export default function DashboardCRM() {
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    pedidosPendentes: 0,
    produtosAtivos: 0,
    faturamentoMes: 0,
    taxaConferencia: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('markethub_token');
        
        // Buscar dados do tenant
        const tenantResponse = await fetch('/api/tenants/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tenantResponse.ok) {
          const tenantData = await tenantResponse.json();
          setTenantInfo(tenantData);
        }

        // Buscar métricas do dashboard
        const metricsResponse = await fetch('/api/dashboard/metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setMetrics(metricsData);
        }

        // Buscar pedidos recentes
        const ordersResponse = await fetch('/api/orders/recent?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setRecentOrders(ordersData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      title: "Pedidos Pendentes",
      value: metrics.pedidosPendentes.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Produtos Ativos",
      value: metrics.produtosAtivos.toString(),
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Faturamento (Mês)",
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.faturamentoMes),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Taxa de Conferência",
      value: `${metrics.taxaConferencia.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tenant Info Header */}
      {tenantInfo && (
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{tenantInfo.nome_empresa}</h2>
                <div className="flex gap-4 mt-2 text-sm opacity-90">
                  <span>CNPJ: {tenantInfo.cnpj}</span>
                  <span>•</span>
                  <span>{tenantInfo.email_contato}</span>
                  {tenantInfo.telefone && (
                    <>
                      <span>•</span>
                      <span>{tenantInfo.telefone}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Plano {tenantInfo.plano}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu e-commerce</p>
      </div>

      {/* Sync Indicator */}
      <SyncIndicator />

      {/* Dashboard Financeiro Inteligente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Visão Financeira Inteligente</CardTitle>
          <CardDescription>Análise completa de contas a pagar, receber e sugestões de investimento</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardFinanceiro />
        </CardContent>
      </Card>

      {/* Currency Widget */}
      <CurrencyWidget />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pedidos Recentes */}
      {recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Últimos pedidos registrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">#{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_name || 'Cliente'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}</p>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
