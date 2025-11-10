import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ShoppingCart, Package, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CurrencyWidget from '@/components/CurrencyWidget';
import { REAL_METRICS, REAL_CATEGORIES, REAL_MARKETPLACES, REAL_DAILY_SALES, REAL_RECENT_ORDERS } from '@/data/real-data';
import SyncIndicator from '@/components/SyncIndicator';
import DashboardFinanceiro from '@/components/DashboardFinanceiro';

// Dados reais do MarketHub CRM - TRUE IMPORTADOS BR
const stats = [
  {
    title: "Pedidos Pendentes",
    value: REAL_METRICS.pedidosPendentes.toString(),
    change: "+2",
    trend: "up",
    icon: ShoppingCart,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    title: "Produtos Ativos",
    value: REAL_METRICS.produtosAtivos.toString(),
    change: "+12",
    trend: "up",
    icon: Package,
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    title: "Faturamento (Mês)",
    value: `R$ ${(REAL_METRICS.totalVendas / 1000).toFixed(1)}k`,
    change: "+15%",
    trend: "up",
    icon: DollarSign,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    title: "Taxa de Conferência",
    value: `${REAL_METRICS.taxaConferencia.toFixed(1)}%`,
    change: "-0.5%",
    trend: "down",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
];

// Dados de vendas da semana (últimos 7 dias do MarketHub CRM)
const salesData = REAL_DAILY_SALES.slice(-7).map((day, index) => ({
  name: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(day.date).getDay()],
  vendas: day.value
}));

// Distribuição real por marketplace
const marketplaceData = REAL_MARKETPLACES.map(mp => ({
  name: mp.name,
  value: Math.round(mp.value / 100), // Converter para centenas para melhor visualização
  color: mp.color
}));

// Pedidos recentes reais
const recentOrders = REAL_RECENT_ORDERS.slice(0, 5);

export default function DashboardCRM() {
  const [modalPedidosPendentes, setModalPedidosPendentes] = useState(false);
  const [modalPedidosConferidos, setModalPedidosConferidos] = useState(false);
  const [modalTicketMedio, setModalTicketMedio] = useState(false);

  // Gerar pedidos pendentes mockados
  const pedidosPendentes = Array.from({ length: 340 }, (_, i) => ({
    id: `#${String(i + 1).padStart(6, '0')}`,
    cliente: `Cliente ${i + 1}`,
    valor: Math.floor(Math.random() * 1000) + 100,
    data: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: ['Aguardando Separação', 'Aguardando Conferência', 'Aguardando Embalagem'][Math.floor(Math.random() * 3)]
  }));

  // Gerar pedidos conferidos mockados
  const pedidosConferidos = Array.from({ length: 821 }, (_, i) => ({
    id: `#${String(i + 1).padStart(6, '0')}`,
    cliente: `Cliente ${i + 1}`,
    valor: Math.floor(Math.random() * 1000) + 100,
    data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    conferente: ['João Silva', 'Maria Santos', 'Pedro Costa'][Math.floor(Math.random() * 3)]
  }));

  return (
    <div className="p-6 space-y-6">
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
            <Dialog 
              open={
                stat.title === 'Pedidos Pendentes' ? modalPedidosPendentes :
                stat.title === 'Taxa de Conferência' ? modalPedidosConferidos :
                stat.title === 'Faturamento (Mês)' ? modalTicketMedio : false
              }
              onOpenChange={(open) => {
                if (stat.title === 'Pedidos Pendentes') setModalPedidosPendentes(open);
                if (stat.title === 'Taxa de Conferência') setModalPedidosConferidos(open);
                if (stat.title === 'Faturamento (Mês)') setModalTicketMedio(open);
              }}
            >
              <DialogTrigger asChild>
                <Card key={stat.title} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === 'up' ? (
                        <ArrowUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-muted-foreground">vs. semana passada</span>
                    </div>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          
          {/* Modais de Detalhes */}
          {stat.title === 'Pedidos Pendentes' && (
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Pedidos Pendentes - Detalhamento
                </DialogTitle>
                <DialogDescription>
                  {pedidosPendentes.length} pedidos aguardando processamento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                {pedidosPendentes.slice(0, 50).map((pedido) => (
                  <div key={pedido.id} className="border rounded-lg p-3 hover:bg-accent flex justify-between items-center">
                    <div>
                      <p className="font-bold">{pedido.id}</p>
                      <p className="text-sm text-muted-foreground">{pedido.cliente}</p>
                      <Badge variant="secondary" className="mt-1">{pedido.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">R$ {pedido.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">{new Date(pedido.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          )}
          
          {stat.title === 'Taxa de Conferência' && (
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Pedidos Conferidos - Detalhamento
                </DialogTitle>
                <DialogDescription>
                  {pedidosConferidos.length} pedidos já conferidos e prontos para envio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                {pedidosConferidos.slice(0, 50).map((pedido) => (
                  <div key={pedido.id} className="border rounded-lg p-3 hover:bg-accent flex justify-between items-center">
                    <div>
                      <p className="font-bold">{pedido.id}</p>
                      <p className="text-sm text-muted-foreground">{pedido.cliente}</p>
                      <p className="text-xs text-muted-foreground mt-1">Conferente: {pedido.conferente}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">R$ {pedido.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">{new Date(pedido.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          )}
          
          {stat.title === 'Faturamento (Mês)' && (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Análise de Faturamento - Detalhamento
                </DialogTitle>
                <DialogDescription>
                  Breakdown completo do faturamento do mês
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Faturamento Total</p>
                    <p className="text-2xl font-bold text-green-600">R$ {REAL_METRICS.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold text-purple-600">R$ {REAL_METRICS.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-blue-600">{REAL_METRICS.totalPedidos}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Pedidos Conferidos</p>
                    <p className="text-2xl font-bold text-green-600">{REAL_METRICS.pedidosConferidos}</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">Distribuição por Categoria</p>
                  <div className="space-y-2">
                    {REAL_CATEGORIES.slice(0, 5).map((cat) => (
                      <div key={cat.name} className="flex justify-between items-center">
                        <span className="text-sm">{cat.name}</span>
                        <span className="font-bold">{cat.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas da Semana</CardTitle>
            <CardDescription>Faturamento diário em reais</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="vendas" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Marketplace Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Marketplace</CardTitle>
            <CardDescription>Pedidos por plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={marketplaceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {marketplaceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
          <CardDescription>Últimos pedidos recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.cliente}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{order.marketplace}</p>
                    <p className="font-semibold text-foreground">R$ {order.valor.toFixed(2)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
