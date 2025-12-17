import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  Loader2,
  Users,
  Package,
  ShoppingCart,
  Zap,
  Crown,
  FileText,
  ExternalLink
} from 'lucide-react';

interface Subscription {
  id: number;
  status: string;
  planName: string;
  planDisplayName: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
}

interface Usage {
  users: { allowed: boolean; current: number; limit: number };
  products: { allowed: boolean; current: number; limit: number };
  orders: { allowed: boolean; current: number; limit: number };
}

interface Modules {
  taxAutomation: boolean;
  cashflow: boolean;
  teamManagement: boolean;
  predictiveAnalytics: boolean;
  integrations: boolean;
  apiAccess: boolean;
}

interface Plan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: Record<string, boolean>;
  limits: {
    users: number;
    products: number;
    ordersPerMonth: number;
  };
  modules: Modules;
}

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  status: string;
  created_at: string;
  pdf_url: string;
}

export default function Subscription() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [modules, setModules] = useState<Modules | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Carregar assinatura atual
      const subResponse = await fetch('/api/subscriptions/current', { headers });
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscription);
        setUsage(subData.usage);
        setModules(subData.modules);
      }

      // Carregar planos
      const plansResponse = await fetch('/api/subscriptions/plans');
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData);
      }

      // Carregar faturas
      const invoicesResponse = await fetch('/api/subscriptions/invoices', { headers });
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData.invoices);
      }
    } catch (err) {
      setError('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    setUpgrading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planName, billingCycle: 'monthly' })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Erro ao criar sessão de checkout');
      }
    } catch (err) {
      setError('Erro ao processar upgrade');
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/subscriptions/portal', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      setError('Erro ao abrir portal de billing');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Ativo' },
      trialing: { variant: 'secondary', label: 'Trial' },
      past_due: { variant: 'destructive', label: 'Pagamento Pendente' },
      canceled: { variant: 'outline', label: 'Cancelado' },
      unpaid: { variant: 'destructive', label: 'Não Pago' }
    };
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getUsagePercent = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Minha Assinatura</h1>
        <p className="text-gray-500">Gerencie seu plano e acompanhe o uso</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Atual */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Plano {subscription.planDisplayName}
                </CardTitle>
                <CardDescription>
                  {subscription.status === 'trialing' && subscription.trialEnd && (
                    <>Trial termina em {formatDate(subscription.trialEnd)}</>
                  )}
                  {subscription.status === 'active' && (
                    <>Próxima cobrança em {formatDate(subscription.currentPeriodEnd)}</>
                  )}
                </CardDescription>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleManageBilling} variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Gerenciar Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uso do Plano */}
      {usage && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Uso do Plano</CardTitle>
            <CardDescription>Acompanhe o consumo dos recursos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Usuários</span>
                </div>
                <span>
                  {usage.users.current} / {usage.users.limit === -1 ? '∞' : usage.users.limit}
                </span>
              </div>
              <Progress value={getUsagePercent(usage.users.current, usage.users.limit)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  <span>Produtos</span>
                </div>
                <span>
                  {usage.products.current} / {usage.products.limit === -1 ? '∞' : usage.products.limit}
                </span>
              </div>
              <Progress value={getUsagePercent(usage.products.current, usage.products.limit)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-purple-500" />
                  <span>Pedidos (este mês)</span>
                </div>
                <span>
                  {usage.orders.current} / {usage.orders.limit === -1 ? '∞' : usage.orders.limit}
                </span>
              </div>
              <Progress value={getUsagePercent(usage.orders.current, usage.orders.limit)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Módulos Disponíveis */}
      {modules && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Módulos do Plano
            </CardTitle>
            <CardDescription>Funcionalidades incluídas no seu plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'taxAutomation', label: 'Automação Tributária', enabled: modules.taxAutomation },
                { key: 'cashflow', label: 'Fluxo de Caixa', enabled: modules.cashflow },
                { key: 'teamManagement', label: 'Gestão de Equipe', enabled: modules.teamManagement },
                { key: 'predictiveAnalytics', label: 'Análise Preditiva', enabled: modules.predictiveAnalytics },
                { key: 'integrations', label: 'Integrações', enabled: modules.integrations },
                { key: 'apiAccess', label: 'Acesso à API', enabled: modules.apiAccess },
              ].map((module) => (
                <div
                  key={module.key}
                  className={`p-3 rounded-lg border ${
                    module.enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {module.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={module.enabled ? 'text-green-800' : 'text-gray-500'}>
                      {module.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planos Disponíveis */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Planos Disponíveis</CardTitle>
          <CardDescription>Compare e faça upgrade do seu plano</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.filter(p => p.name !== 'free' && p.name !== 'enterprise').map((plan) => (
              <div
                key={plan.name}
                className={`p-4 rounded-lg border ${
                  subscription?.planName === plan.name
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200'
                }`}
              >
                <h3 className="font-semibold text-lg">{plan.displayName}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold">R$ {plan.priceMonthly}</span>
                  <span className="text-gray-500">/mês</span>
                </div>

                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {plan.limits.users === -1 ? 'Usuários ilimitados' : `${plan.limits.users} usuários`}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {plan.limits.products === -1 ? 'Produtos ilimitados' : `${plan.limits.products} produtos`}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {plan.limits.ordersPerMonth === -1 ? 'Pedidos ilimitados' : `${plan.limits.ordersPerMonth} pedidos/mês`}
                  </li>
                </ul>

                {subscription?.planName === plan.name ? (
                  <Button disabled className="w-full">
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={upgrading}
                    className="w-full"
                  >
                    {upgrading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Fazer Upgrade
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Faturas */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Faturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{invoice.invoice_number}</span>
                    <span className="text-sm text-gray-500 ml-4">
                      {formatDate(invoice.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      R$ {invoice.amount.toFixed(2)}
                    </span>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status === 'paid' ? 'Pago' : invoice.status}
                    </Badge>
                    {invoice.pdf_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
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
