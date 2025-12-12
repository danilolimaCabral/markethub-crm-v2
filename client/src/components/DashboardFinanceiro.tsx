import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";

interface FinancialData {
  saldoAtual: number;
  aReceber30d: number;
  aPagar30d: number;
  contasVencidas: number;
  totalVencido: number;
  pagarProximos7Dias: { total: number; quantidade: number };
  pagarProximos15Dias: { total: number; quantidade: number };
  pagarProximos30Dias: { total: number; quantidade: number };
  receberProximos7Dias: { total: number; quantidade: number };
  receberProximos15Dias: { total: number; quantidade: number };
  receberProximos30Dias: { total: number; quantidade: number };
}

export default function DashboardFinanceiro() {
  const [data, setData] = useState<FinancialData>({
    saldoAtual: 0,
    aReceber30d: 0,
    aPagar30d: 0,
    contasVencidas: 0,
    totalVencido: 0,
    pagarProximos7Dias: { total: 0, quantidade: 0 },
    pagarProximos15Dias: { total: 0, quantidade: 0 },
    pagarProximos30Dias: { total: 0, quantidade: 0 },
    receberProximos7Dias: { total: 0, quantidade: 0 },
    receberProximos15Dias: { total: 0, quantidade: 0 },
    receberProximos30Dias: { total: 0, quantidade: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const token = localStorage.getItem('markethub_token');
        const response = await fetch('/api/financial/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const financialData = await response.json();
          setData(financialData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const saldoProjetado = data.saldoAtual + data.aReceber30d - data.aPagar30d;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Contas Vencidas */}
      {data.contasVencidas > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">
                    {data.contasVencidas} conta(s) vencida(s)
                  </p>
                  <p className="text-sm text-red-700">
                    Total: {formatCurrency(data.totalVencido)}
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm">
                Ver Detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.saldoAtual)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Receber (30d)</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.aReceber30d)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Pagar (30d)</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.aPagar30d)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Projetado</p>
                <p className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldoProjetado)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${saldoProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Previsões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Previsão de Pagamentos */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Previsão de Pagamentos</h3>
            <p className="text-sm text-muted-foreground mb-4">Próximos vencimentos</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-900">Próximos 7 dias</p>
                  <p className="text-xs text-orange-700">{data.pagarProximos7Dias.quantidade} contas</p>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(data.pagarProximos7Dias.total)}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-900">Próximos 15 dias</p>
                  <p className="text-xs text-orange-700">{data.pagarProximos15Dias.quantidade} contas</p>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(data.pagarProximos15Dias.total)}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-900">Próximos 30 dias</p>
                  <p className="text-xs text-orange-700">{data.pagarProximos30Dias.quantidade} contas</p>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(data.pagarProximos30Dias.total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previsão de Recebimentos */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Previsão de Recebimentos</h3>
            <p className="text-sm text-muted-foreground mb-4">Próximas entradas</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Próximos 7 dias</p>
                  <p className="text-xs text-green-700">{data.receberProximos7Dias.quantidade} contas</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(data.receberProximos7Dias.total)}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Próximos 15 dias</p>
                  <p className="text-xs text-green-700">{data.receberProximos15Dias.quantidade} contas</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(data.receberProximos15Dias.total)}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Próximos 30 dias</p>
                  <p className="text-xs text-green-700">{data.receberProximos30Dias.quantidade} contas</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(data.receberProximos30Dias.total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sugestão de Investimento */}
      {saldoProjetado > 10000 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Sugestão de Investimento</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Baseado no seu saldo projetado de {formatCurrency(saldoProjetado)}
                </p>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Considere investir o excedente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {saldoProjetado < 0 && (
        <Card className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Atenção ao Fluxo de Caixa</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Seu saldo projetado está negativo: {formatCurrency(saldoProjetado)}
                </p>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  Revise suas despesas e recebimentos
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
