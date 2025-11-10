import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Calendar, Lightbulb, CheckCircle, Clock, X, Bitcoin, TrendingUpIcon } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Importar dados reais das contas
const generateContasPagar = () => {
  const descricoes = [
    'Fornecedor - Mercadorias', 'Aluguel - Loja', 'Energia Elétrica', 'Internet e Telefone',
    'Fornecedor - Embalagens', 'Frete - Mercadorias', 'Contador - Honorários', 'Marketing - Anúncios ML',
    'Água e Esgoto', 'Manutenção - Equipamentos', 'Salários - Funcionários', 'INSS - Impostos',
    'Seguro - Loja', 'Material de Escritório', 'Limpeza e Conservação', 'Telefonia Móvel'
  ];
  
  const categorias = ['Fornecedores', 'Despesas Fixas', 'Logística', 'Serviços', 'Marketing', 'Impostos', 'Pessoal'];
  const formasPagamento = ['Boleto', 'Transferência', 'PIX', 'Débito Automático', 'Cartão de Crédito'];
  
  const contas = [];
  for (let i = 1; i <= 50; i++) {
    const diaVencimento = Math.floor(Math.random() * 28) + 1;
    const mesVencimento = i <= 35 ? 11 : 10;
    const status = i <= 5 ? 'vencido' : i <= 35 ? 'pendente' : 'pago';
    
    contas.push({
      id: i,
      descricao: `${descricoes[i % descricoes.length]} #${String(i).padStart(3, '0')}`,
      valor: Math.floor(Math.random() * 15000) + 200,
      vencimento: `2025-${String(mesVencimento).padStart(2, '0')}-${String(diaVencimento).padStart(2, '0')}`,
      status,
      categoria: categorias[Math.floor(Math.random() * categorias.length)],
      formaPagamento: formasPagamento[Math.floor(Math.random() * formasPagamento.length)]
    });
  }
  
  return contas.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
};

const generateContasReceber = () => {
  const clientes = [
    'João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Mendes',
    'Juliana Lima', 'Roberto Alves', 'Fernanda Souza', 'Lucas Pereira', 'Camila Rocha',
    'Ricardo Santos', 'Patricia Lima', 'Marcos Oliveira', 'Beatriz Costa', 'Felipe Almeida'
  ];
  
  const contas = [];
  for (let i = 1; i <= 50; i++) {
    const diaVencimento = Math.floor(Math.random() * 28) + 1;
    const mesVencimento = i <= 40 ? 11 : 10;
    const status = i <= 3 ? 'atrasado' : i <= 30 ? 'pendente' : 'recebido';
    
    contas.push({
      id: i,
      descricao: `Venda Mercado Livre #ML${String(i).padStart(4, '0')}`,
      valor: Math.floor(Math.random() * 3000) + 150,
      vencimento: `2025-${String(mesVencimento).padStart(2, '0')}-${String(diaVencimento).padStart(2, '0')}`,
      status,
      categoria: 'Vendas Online',
      cliente: clientes[i % clientes.length]
    });
  }
  
  return contas.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
};

const contasPagar = generateContasPagar();
const contasReceber = generateContasReceber();

// Calcular métricas reais
const hoje = new Date('2025-11-05');
const em7Dias = new Date(hoje);
em7Dias.setDate(hoje.getDate() + 7);
const em15Dias = new Date(hoje);
em15Dias.setDate(hoje.getDate() + 15);
const em30Dias = new Date(hoje);
em30Dias.setDate(hoje.getDate() + 30);

// Contas vencidas
const contasVencidas = contasPagar.filter(c => c.status === 'vencido');
const totalVencido = contasVencidas.reduce((sum, c) => sum + c.valor, 0);

// Previsão de pagamentos
const pagarEm7Dias = contasPagar.filter(c => {
  const venc = new Date(c.vencimento);
  return c.status === 'pendente' && venc <= em7Dias && venc >= hoje;
});
const pagarEm15Dias = contasPagar.filter(c => {
  const venc = new Date(c.vencimento);
  return c.status === 'pendente' && venc <= em15Dias && venc >= hoje;
});
const pagarEm30Dias = contasPagar.filter(c => {
  const venc = new Date(c.vencimento);
  return c.status === 'pendente' && venc <= em30Dias && venc >= hoje;
});

// Previsão de recebimentos
const receberEm7Dias = contasReceber.filter(c => {
  const venc = new Date(c.vencimento);
  return c.status === 'pendente' && venc <= em7Dias && venc >= hoje;
});
const receberEm15Dias = contasReceber.filter(c => {
  const venc = new Date(c.vencimento);
  return c.status === 'pendente' && venc <= em15Dias && venc >= hoje;
});
const receberEm30Dias = contasReceber.filter(c => {
  const venc = new Date(c.vencimento);
  return c.status === 'pendente' && venc <= em30Dias && venc >= hoje;
});

// Saldo atual e projeções
const saldoAtual = 85000; // Baseado no fluxo de caixa
const totalAPagar = contasPagar.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0);
const totalAReceber = contasReceber.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0);
const saldoProjetado = saldoAtual + totalAReceber - totalAPagar;

// Dados para gráfico de projeção
const projecaoData = [
  { 
    periodo: 'Hoje', 
    saldo: saldoAtual,
    entradas: 0,
    saidas: 0
  },
  { 
    periodo: '7 dias', 
    saldo: saldoAtual + receberEm7Dias.reduce((s, c) => s + c.valor, 0) - pagarEm7Dias.reduce((s, c) => s + c.valor, 0),
    entradas: receberEm7Dias.reduce((s, c) => s + c.valor, 0),
    saidas: pagarEm7Dias.reduce((s, c) => s + c.valor, 0)
  },
  { 
    periodo: '15 dias', 
    saldo: saldoAtual + receberEm15Dias.reduce((s, c) => s + c.valor, 0) - pagarEm15Dias.reduce((s, c) => s + c.valor, 0),
    entradas: receberEm15Dias.reduce((s, c) => s + c.valor, 0),
    saidas: pagarEm15Dias.reduce((s, c) => s + c.valor, 0)
  },
  { 
    periodo: '30 dias', 
    saldo: saldoProjetado,
    entradas: receberEm30Dias.reduce((s, c) => s + c.valor, 0),
    saidas: pagarEm30Dias.reduce((s, c) => s + c.valor, 0)
  },
];

// Sugestões de investimento baseadas no saldo projetado
const getSugestoesInvestimento = () => {
  const saldoDisponivel = saldoProjetado - (totalAPagar * 0.2); // Mantém 20% de reserva
  
  if (saldoDisponivel < 10000) {
    return {
      tipo: 'Reserva de Emergência',
      recomendacao: 'Foque em construir uma reserva de emergência antes de investir',
      cor: 'text-yellow-600',
      bgCor: 'bg-yellow-100'
    };
  } else if (saldoDisponivel < 50000) {
    return {
      tipo: 'Renda Fixa',
      recomendacao: `Invista R$ ${(saldoDisponivel * 0.7).toLocaleString('pt-BR')} em CDB ou Tesouro Direto (rendimento ~13% a.a.)`,
      cor: 'text-green-600',
      bgCor: 'bg-green-100'
    };
  } else {
    return {
      tipo: 'Diversificação',
      recomendacao: `Diversifique: 60% Renda Fixa (R$ ${(saldoDisponivel * 0.6).toLocaleString('pt-BR')}), 30% Fundos (R$ ${(saldoDisponivel * 0.3).toLocaleString('pt-BR')}), 10% Reserva`,
      cor: 'text-blue-600',
      bgCor: 'bg-blue-100'
    };
  }
};

const sugestaoInvestimento = getSugestoesInvestimento();

export default function DashboardFinanceiro() {
  const [modalContasAberto, setModalContasAberto] = useState(false);
  return (
    <div className="space-y-6">
      {/* Alertas de Contas Vencidas */}
      {contasVencidas.length > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <p className="font-bold text-red-900 dark:text-red-100">
                  {contasVencidas.length} conta(s) vencida(s)
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Total: R$ {totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Dialog open={modalContasAberto} onOpenChange={setModalContasAberto}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">Ver Detalhes</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Contas Vencidas - Ação Necessária
                    </DialogTitle>
                    <DialogDescription>
                      {contasVencidas.length} conta(s) vencida(s) totalizando R$ {totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    {contasVencidas.map((conta) => (
                      <div key={conta.id} className="border rounded-lg p-4 hover:bg-accent">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold">{conta.descricao}</h4>
                            <p className="text-sm text-muted-foreground">{conta.categoria}</p>
                          </div>
                          <Badge variant="destructive">Vencido</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Valor</p>
                            <p className="font-bold text-red-600">R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Vencimento</p>
                            <p className="font-medium">{new Date(conta.vencimento).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Dias Atraso</p>
                            <p className="font-bold text-red-600">
                              {Math.floor((new Date().getTime() - new Date(conta.vencimento).getTime()) / (1000 * 60 * 60 * 24))} dias
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Forma Pagamento</p>
                            <p className="font-medium">{conta.formaPagamento}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="default" className="flex-1">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marcar como Paga
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            Agendar Pagamento
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Saldo Atual</p>
                <p className="text-xl font-bold text-blue-600">
                  R$ {saldoAtual.toLocaleString('pt-BR')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">A Receber (30d)</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {totalAReceber.toLocaleString('pt-BR')}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">A Pagar (30d)</p>
                <p className="text-xl font-bold text-red-600">
                  R$ {totalAPagar.toLocaleString('pt-BR')}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Saldo Projetado</p>
                <p className={`text-xl font-bold ${saldoProjetado > saldoAtual ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {saldoProjetado.toLocaleString('pt-BR')}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Previsão de Pagamentos e Recebimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previsão de Pagamentos</CardTitle>
            <CardDescription>Próximos vencimentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">Próximos 7 dias</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">
                  R$ {pagarEm7Dias.reduce((s, c) => s + c.valor, 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">{pagarEm7Dias.length} contas</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Próximos 15 dias</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">
                  R$ {pagarEm15Dias.reduce((s, c) => s + c.valor, 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">{pagarEm15Dias.length} contas</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">Próximos 30 dias</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">
                  R$ {pagarEm30Dias.reduce((s, c) => s + c.valor, 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">{pagarEm30Dias.length} contas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previsão de Recebimentos</CardTitle>
            <CardDescription>Próximas entradas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Próximos 7 dias</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">
                  R$ {receberEm7Dias.reduce((s, c) => s + c.valor, 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">{receberEm7Dias.length} contas</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium">Próximos 15 dias</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">
                  R$ {receberEm15Dias.reduce((s, c) => s + c.valor, 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">{receberEm15Dias.length} contas</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium">Próximos 30 dias</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">
                  R$ {receberEm30Dias.reduce((s, c) => s + c.valor, 0).toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">{receberEm30Dias.length} contas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Projeção de Saldo */}
      <Card>
        <CardHeader>
          <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
          <CardDescription>Evolução do saldo nos próximos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projecaoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
              />
              <Legend />
              <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={3} name="Saldo Projetado" />
              <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} name="Entradas" />
              <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} name="Saídas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sugestão de Investimento */}
      <Card className={`border-2 ${sugestaoInvestimento.bgCor}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${sugestaoInvestimento.bgCor}`}>
              <Lightbulb className={`w-8 h-8 ${sugestaoInvestimento.cor}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Sugestão de Investimento</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Baseado no seu saldo projetado de R$ {saldoProjetado.toLocaleString('pt-BR')}
              </p>
              <div className={`p-4 rounded-lg ${sugestaoInvestimento.bgCor} border-2`}>
                <p className="font-bold mb-1">{sugestaoInvestimento.tipo}</p>
                <p className="text-sm">{sugestaoInvestimento.recomendacao}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
