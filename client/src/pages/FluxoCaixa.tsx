import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Filter } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SyncIndicator from "@/components/SyncIndicator";

// Dados de fluxo de caixa
const fluxoCaixaData = [
  { mes: 'Jun', entradas: 45000, saidas: 32000, saldo: 13000 },
  { mes: 'Jul', entradas: 52000, saidas: 35000, saldo: 17000 },
  { mes: 'Ago', entradas: 48000, saidas: 38000, saldo: 10000 },
  { mes: 'Set', entradas: 55000, saidas: 40000, saldo: 15000 },
  { mes: 'Out', entradas: 62000, saidas: 42000, saldo: 20000 },
  { mes: 'Nov', entradas: 68000, saidas: 45000, saldo: 23000 },
];

const saldoAtual = 85000;
const totalEntradas = 380000;
const totalSaidas = 232000;
const saldoProjetado = saldoAtual + 23000;

export default function FluxoCaixa() {
  const stats = [
    {
      title: "Saldo Atual",
      value: `R$ ${saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Total Entradas (6 meses)",
      value: `R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total Saídas (6 meses)",
      value: `R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      title: "Saldo Projetado",
      value: `R$ ${saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
        <p className="text-muted-foreground">Acompanhe entradas, saídas e saldo realizado</p>
      </div>

      {/* Sync Indicator */}
      <SyncIndicator />

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
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entradas vs Saídas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Entradas vs Saídas</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fluxoCaixaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Legend />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução do Saldo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Evolução do Saldo</CardTitle>
                <CardDescription>Saldo acumulado mensal</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fluxoCaixaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Saldo"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Mensal</CardTitle>
          <CardDescription>Fluxo de caixa realizado por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Mês</th>
                  <th className="text-right p-3 text-sm font-medium">Entradas</th>
                  <th className="text-right p-3 text-sm font-medium">Saídas</th>
                  <th className="text-right p-3 text-sm font-medium">Saldo</th>
                  <th className="text-center p-3 text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {fluxoCaixaData.map((item, index) => (
                  <tr key={item.mes} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="p-3 text-sm font-medium">{item.mes}/2025</td>
                    <td className="p-3 text-sm text-right font-bold text-green-600">
                      + R$ {item.entradas.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-sm text-right font-bold text-red-600">
                      - R$ {item.saidas.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-sm text-right font-bold text-blue-600">
                      R$ {item.saldo.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={item.saldo > 0 ? "secondary" : "destructive"}>
                        {item.saldo > 0 ? "Positivo" : "Negativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 font-bold">
                <tr>
                  <td className="p-3 text-sm">TOTAL</td>
                  <td className="p-3 text-sm text-right text-green-600">
                    R$ {totalEntradas.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 text-sm text-right text-red-600">
                    R$ {totalSaidas.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 text-sm text-right text-blue-600">
                    R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
