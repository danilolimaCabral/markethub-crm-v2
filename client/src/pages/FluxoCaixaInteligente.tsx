import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Building2,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Lock
} from 'lucide-react';

interface BankAccount {
  id: number;
  name: string;
  bank_name: string;
  current_balance: number;
  is_default: boolean;
}

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
  due_date: string;
  status: string;
  bank_account_name: string;
}

interface Summary {
  balance: number;
  income: { paid: number; pending: number };
  expense: { paid: number; pending: number };
  netCashflow: number;
  byCategory: Array<{ type: string; category: string; total: number }>;
  upcoming: Transaction[];
}

interface ChartData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export default function FluxoCaixaInteligente() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [period, setPeriod] = useState('month');
  const [filterType, setFilterType] = useState('all');

  // Form states
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    category: '',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    due_date: '',
    bank_account_id: ''
  });

  const [newAccount, setNewAccount] = useState({
    name: '',
    bank_name: '',
    agency: '',
    account_number: '',
    current_balance: ''
  });

  useEffect(() => {
    loadData();
  }, [period]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      // Carregar resumo
      const summaryRes = await fetch(`/api/cashflow/summary?period=${period}`, { headers });
      if (summaryRes.status === 403) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      // Carregar contas
      const accountsRes = await fetch('/api/cashflow/accounts', { headers });
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data);
      }

      // Carregar transações
      const transactionsRes = await fetch(`/api/cashflow/transactions?limit=20`, { headers });
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions);
      }

      // Carregar dados do gráfico
      const chartRes = await fetch(`/api/cashflow/chart?period=${period}`, { headers });
      if (chartRes.ok) {
        const data = await chartRes.json();
        setChartData(data);
      }
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const response = await fetch('/api/cashflow/transactions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newTransaction,
          amount: parseFloat(newTransaction.amount)
        })
      });

      if (response.ok) {
        setShowAddTransaction(false);
        setNewTransaction({
          type: 'expense',
          category: '',
          description: '',
          amount: '',
          transaction_date: new Date().toISOString().split('T')[0],
          due_date: '',
          bank_account_id: ''
        });
        loadData();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao adicionar transação');
    }
  };

  const handleAddAccount = async () => {
    try {
      const response = await fetch('/api/cashflow/accounts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newAccount,
          current_balance: parseFloat(newAccount.current_balance) || 0
        })
      });

      if (response.ok) {
        setShowAddAccount(false);
        setNewAccount({
          name: '',
          bank_name: '',
          agency: '',
          account_number: '',
          current_balance: ''
        });
        loadData();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao adicionar conta');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Tela de acesso negado
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="text-center py-12">
          <CardContent>
            <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Módulo Não Disponível</h2>
            <p className="text-gray-500 mb-6">
              O módulo de Fluxo de Caixa Inteligente não está incluído no seu plano atual.
            </p>
            <Button onClick={() => window.location.href = '/settings/subscription'}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Fazer Upgrade do Plano
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8 text-indigo-600" />
            Fluxo de Caixa Inteligente
          </h1>
          <p className="text-gray-500">Gerencie suas finanças de forma inteligente</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
                <DialogDescription>Adicione uma nova receita ou despesa</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(v) => setNewTransaction({ ...newTransaction, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      placeholder="Ex: Vendas, Aluguel"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    placeholder="Descrição da transação"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newTransaction.transaction_date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Conta Bancária</Label>
                  <Select
                    value={newTransaction.bank_account_id}
                    onValueChange={(v) => setNewTransaction({ ...newTransaction, bank_account_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddTransaction} className="w-full">
                  Adicionar Transação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Saldo Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.balance)}</p>
                </div>
                <Wallet className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Receitas</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.income.paid)}</p>
                  <p className="text-xs text-gray-400">+{formatCurrency(summary.income.pending)} pendente</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Despesas</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.expense.paid)}</p>
                  <p className="text-xs text-gray-400">+{formatCurrency(summary.expense.pending)} pendente</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Fluxo Líquido</p>
                  <p className={`text-2xl font-bold ${summary.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.netCashflow)}
                  </p>
                </div>
                {summary.netCashflow >= 0 ? (
                  <ArrowUpRight className="h-8 w-8 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="accounts">Contas Bancárias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Gráfico de Fluxo de Caixa */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Evolução do Fluxo de Caixa</CardTitle>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">7 dias</SelectItem>
                    <SelectItem value="month">30 dias</SelectItem>
                    <SelectItem value="year">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} />
                  <YAxis tickFormatter={(v) => `R$ ${v}`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Receitas" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" name="Despesas" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="balance" name="Saldo" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Próximos Vencimentos */}
          {summary && summary.upcoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximos Vencimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.upcoming.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-gray-500">Vence em {formatDate(tx.due_date)}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transações Recentes</CardTitle>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="income">Receitas</SelectItem>
                      <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions
                  .filter(tx => filterType === 'all' || tx.type === filterType)
                  .map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        {tx.type === 'income' ? (
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-gray-500">
                            {tx.category} • {formatDate(tx.transaction_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <Badge variant={tx.status === 'paid' ? 'default' : 'secondary'}>
                          {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Contas Bancárias
                </CardTitle>
                <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conta
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Conta Bancária</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome da Conta</Label>
                        <Input
                          value={newAccount.name}
                          onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                          placeholder="Ex: Conta Principal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Banco</Label>
                        <Input
                          value={newAccount.bank_name}
                          onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                          placeholder="Ex: Banco do Brasil"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Agência</Label>
                          <Input
                            value={newAccount.agency}
                            onChange={(e) => setNewAccount({ ...newAccount, agency: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Conta</Label>
                          <Input
                            value={newAccount.account_number}
                            onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Saldo Inicial</Label>
                        <Input
                          type="number"
                          value={newAccount.current_balance}
                          onChange={(e) => setNewAccount({ ...newAccount, current_balance: e.target.value })}
                          placeholder="0,00"
                        />
                      </div>
                      <Button onClick={handleAddAccount} className="w-full">
                        Adicionar Conta
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {accounts.map((account) => (
                  <div key={account.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{account.name}</h3>
                        <p className="text-sm text-gray-500">{account.bank_name}</p>
                      </div>
                      {account.is_default && (
                        <Badge>Principal</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(account.current_balance)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
