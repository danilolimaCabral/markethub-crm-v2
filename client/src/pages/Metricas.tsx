import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Calendar } from 'lucide-react';

type Periodo = 'semana' | 'mes' | 'ano';

export default function Metricas() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Periodo>('mes');

  // Dados por período
  const dadosPorPeriodo = {
    semana: {
      vendas: [
        { periodo: 'Seg', vendas: 6500, pedidos: 18, ticket: 361 },
        { periodo: 'Ter', vendas: 7200, pedidos: 20, ticket: 360 },
        { periodo: 'Qua', vendas: 8100, pedidos: 22, ticket: 368 },
        { periodo: 'Qui', vendas: 9500, pedidos: 26, ticket: 365 },
        { periodo: 'Sex', vendas: 11200, pedidos: 30, ticket: 373 },
        { periodo: 'Sáb', vendas: 13500, pedidos: 35, ticket: 386 },
        { periodo: 'Dom', vendas: 11000, pedidos: 28, ticket: 393 },
      ],
      kpis: {
        faturamento: 'R$ 67.000',
        pedidos: '179',
        produtos: '895',
        ticket: 'R$ 374'
      }
    },
    mes: {
      vendas: [
        { periodo: 'Jan', vendas: 45000, pedidos: 120, ticket: 375 },
        { periodo: 'Fev', vendas: 52000, pedidos: 135, ticket: 385 },
        { periodo: 'Mar', vendas: 48000, pedidos: 128, ticket: 375 },
        { periodo: 'Abr', vendas: 61000, pedidos: 155, ticket: 393 },
        { periodo: 'Mai', vendas: 55000, pedidos: 142, ticket: 387 },
        { periodo: 'Jun', vendas: 67000, pedidos: 168, ticket: 398 },
      ],
      kpis: {
        faturamento: 'R$ 328.000',
        pedidos: '848',
        produtos: '4.475',
        ticket: 'R$ 387'
      }
    },
    ano: {
      vendas: [
        { periodo: '2019', vendas: 1200000, pedidos: 3200, ticket: 375 },
        { periodo: '2020', vendas: 1450000, pedidos: 3800, ticket: 381 },
        { periodo: '2021', vendas: 1680000, pedidos: 4350, ticket: 386 },
        { periodo: '2022', vendas: 1920000, pedidos: 4950, ticket: 388 },
        { periodo: '2023', vendas: 2250000, pedidos: 5780, ticket: 389 },
        { periodo: '2024', vendas: 2680000, pedidos: 6850, ticket: 391 },
      ],
      kpis: {
        faturamento: 'R$ 2.680.000',
        pedidos: '6.850',
        produtos: '38.250',
        ticket: 'R$ 391'
      }
    }
  };

  const produtosMaisVendidos = [
    { nome: 'Produto A', vendas: 1250, valor: 45890 },
    { nome: 'Produto B', vendas: 980, valor: 38200 },
    { nome: 'Produto C', vendas: 875, valor: 32450 },
    { nome: 'Produto D', vendas: 720, valor: 28900 },
    { nome: 'Produto E', vendas: 650, valor: 24500 },
  ];

  const distribuicaoCanais = [
    { name: 'Mercado Livre', value: 41, color: '#FFE600' },
    { name: 'Amazon', value: 28, color: '#FF9900' },
    { name: 'Shopee', value: 18, color: '#EE4D2D' },
    { name: 'Site Próprio', value: 13, color: '#4F46E5' },
  ];

  const dadosAtuais = dadosPorPeriodo[periodoSelecionado];

  const kpis = [
    {
      title: 'Faturamento Total',
      value: dadosAtuais.kpis.faturamento,
      change: '+15%',
      positive: true,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total de Pedidos',
      value: dadosAtuais.kpis.pedidos,
      change: '+12%',
      positive: true,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Produtos Vendidos',
      value: dadosAtuais.kpis.produtos,
      change: '+8%',
      positive: true,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Ticket Médio',
      value: dadosAtuais.kpis.ticket,
      change: '+3%',
      positive: true,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header com Filtro */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Métricas</h1>
          <p className="text-muted-foreground">Análise detalhada de performance e indicadores</p>
        </div>
        
        {/* Filtro de Período */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
          <Button
            variant={periodoSelecionado === 'semana' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriodoSelecionado('semana')}
            className="h-8"
          >
            Semana
          </Button>
          <Button
            variant={periodoSelecionado === 'mes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriodoSelecionado('mes')}
            className="h-8"
          >
            Mês
          </Button>
          <Button
            variant={periodoSelecionado === 'ano' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriodoSelecionado('ano')}
            className="h-8"
          >
            Ano
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{kpi.title}</span>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                <div className={`flex items-center gap-1 text-sm ${kpi.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.positive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{kpi.change}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Período */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Vendas por {periodoSelecionado === 'semana' ? 'Dia' : periodoSelecionado === 'mes' ? 'Mês' : 'Ano'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosAtuais.vendas}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="vendas" stroke="#4F46E5" strokeWidth={2} name="Vendas (R$)" />
              <Line type="monotone" dataKey="pedidos" stroke="#10B981" strokeWidth={2} name="Pedidos" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribuição por Canal */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Distribuição por Canal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribuicaoCanais}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distribuicaoCanais.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Produtos Mais Vendidos */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Produtos Mais Vendidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={produtosMaisVendidos}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="vendas" fill="#4F46E5" name="Quantidade Vendida" />
              <Bar dataKey="valor" fill="#10B981" name="Faturamento (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabela de Análise Detalhada */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Análise Detalhada</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Período</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Vendas (R$)</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Pedidos</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Ticket Médio</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Variação</th>
              </tr>
            </thead>
            <tbody>
              {dadosAtuais.vendas.map((item, index) => {
                const variacaoAnterior = index > 0 
                  ? ((item.vendas - dadosAtuais.vendas[index - 1].vendas) / dadosAtuais.vendas[index - 1].vendas * 100).toFixed(1)
                  : 0;
                const isPositive = Number(variacaoAnterior) >= 0;
                
                return (
                  <tr key={index} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm text-foreground">{item.periodo}</td>
                    <td className="py-3 px-4 text-sm text-right text-foreground">
                      R$ {item.vendas.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-foreground">{item.pedidos}</td>
                    <td className="py-3 px-4 text-sm text-right text-foreground">R$ {item.ticket}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {index > 0 ? `${variacaoAnterior}%` : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
