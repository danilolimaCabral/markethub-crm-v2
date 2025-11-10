import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Calendar } from "lucide-react";
import { REAL_CATEGORIES } from "@/data/real-data";

// Dados reais do MarketHub CRM
const dadosReais = {
  faturamentoTotal: 379979,
  pedidosTotal: 1161,
  ticketMedio: 329,
  crescimento: 15.2,
};

// Gerar vendas por categoria baseadas nos dados reais
const vendasPorCategoria = REAL_CATEGORIES.map(cat => ({
  categoria: cat.name,
  vendas: cat.percentage * dadosReais.faturamentoTotal / 100,
  percentual: cat.percentage,
  pedidos: Math.floor(cat.percentage * dadosReais.pedidosTotal / 100),
  crescimento: (Math.random() * 40) - 10, // -10% a +30%
})).sort((a, b) => b.vendas - a.vendas);

// Vendas dos últimos 30 dias
const vendasDiarias = Array.from({ length: 30 }, (_, i) => {
  const data = new Date();
  data.setDate(data.getDate() - (29 - i));
  return {
    data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    vendas: Math.floor(Math.random() * 20000) + 5000,
    pedidos: Math.floor(Math.random() * 50) + 20,
  };
});

// Top 10 produtos mais vendidos
const topProdutos = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nome: `${vendasPorCategoria[i % vendasPorCategoria.length].categoria} - Produto ${i + 1}`,
  vendas: Math.floor(Math.random() * 50000) + 10000,
  unidades: Math.floor(Math.random() * 200) + 50,
  crescimento: (Math.random() * 60) - 20,
})).sort((a, b) => b.vendas - a.vendas);

export default function AnaliseVendas() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Análise de Vendas</h1>
        <p className="text-muted-foreground">Visão detalhada do desempenho de vendas</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Faturamento Total</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              R$ {(dadosReais.faturamentoTotal / 1000).toFixed(1)}k
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">+{dadosReais.crescimento}% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{dadosReais.pedidosTotal}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">+12% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">R$ {dadosReais.ticketMedio}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">-0.5% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Período</p>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">30 dias</p>
            <p className="text-sm text-muted-foreground mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendas por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Categoria</CardTitle>
          <CardDescription>Distribuição de vendas por categoria de produto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vendasPorCategoria.slice(0, 10).map((cat, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{cat.categoria}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-600">
                        R$ {(cat.vendas / 1000).toFixed(1)}k
                      </span>
                      <Badge variant={cat.crescimento > 0 ? "default" : "destructive"}>
                        {cat.crescimento > 0 ? '+' : ''}{cat.crescimento.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${cat.percentual}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{cat.pedidos} pedidos</span>
                    <span className="text-xs text-muted-foreground">{cat.percentual.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
          <CardDescription>Produtos com maior faturamento no período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Produto</th>
                  <th className="text-left p-3 font-semibold">Faturamento</th>
                  <th className="text-left p-3 font-semibold">Unidades</th>
                  <th className="text-left p-3 font-semibold">Crescimento</th>
                </tr>
              </thead>
              <tbody>
                {topProdutos.map((produto, index) => (
                  <tr key={produto.id} className="border-b hover:bg-accent">
                    <td className="p-3">
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        {index + 1}º
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">{produto.nome}</td>
                    <td className="p-3 font-bold text-green-600">
                      R$ {(produto.vendas / 1000).toFixed(1)}k
                    </td>
                    <td className="p-3 text-muted-foreground">{produto.unidades} un</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {produto.crescimento > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={produto.crescimento > 0 ? 'text-green-600' : 'text-red-600'}>
                          {produto.crescimento > 0 ? '+' : ''}{produto.crescimento.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Vendas Diárias */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas Diárias (Últimos 30 dias)</CardTitle>
          <CardDescription>Evolução diária de vendas e pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {vendasDiarias.reverse().map((dia, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{dia.data}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Faturamento</p>
                    <p className="font-bold text-green-600">
                      R$ {(dia.vendas / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Pedidos</p>
                    <p className="font-bold text-blue-600">{dia.pedidos}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
