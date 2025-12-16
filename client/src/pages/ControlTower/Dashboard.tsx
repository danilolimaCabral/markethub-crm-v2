import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  Building2, Users, Server, FileText, Clock, AlertTriangle, 
  TrendingUp, DollarSign, CheckCircle, XCircle, Timer
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  summary: {
    platforms_count: number;
    clients_count: number;
    instances_count: number;
    contracts_count: number;
    total_mrr: number;
  };
  demands_by_status: Array<{ status: string; count: number }>;
  recent_demands: Array<{
    id: string;
    demand_number: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    instance_name: string;
    client_name: string;
  }>;
  weekly_hours: {
    total_hours: number;
    billable_hours: number;
  };
  expiring_contracts: Array<{
    id: string;
    contract_number: string;
    title: string;
    end_date: string;
    mrr_value: number;
    client_name: string;
  }>;
  pending_invoices: Array<{
    id: string;
    invoice_number: string;
    total: number;
    due_date: string;
    status: string;
    client_name: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const statusLabels: Record<string, string> = {
  open: 'Aberto',
  triaging: 'Triagem',
  planned: 'Planejado',
  in_progress: 'Em Andamento',
  review: 'Revisão',
  testing: 'Teste',
  deployed: 'Implantado',
  closed: 'Fechado',
  cancelled: 'Cancelado'
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

const typeLabels: Record<string, string> = {
  change: 'Mudança',
  bug: 'Bug',
  improvement: 'Melhoria',
  support: 'Suporte',
  project: 'Projeto'
};

export default function ControlTowerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mrrByPlatform, setMrrByPlatform] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
    fetchMrrByPlatform();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/control-tower/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMrrByPlatform = async () => {
    try {
      const response = await fetch('/api/control-tower/dashboard/mrr-by-platform', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setMrrByPlatform(result);
      }
    } catch (error) {
      console.error('Erro ao carregar MRR por plataforma:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar dados do dashboard</p>
      </div>
    );
  }

  const demandsPieData = data.demands_by_status.map(item => ({
    name: statusLabels[item.status] || item.status,
    value: parseInt(String(item.count))
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Control Tower</h1>
          <p className="text-muted-foreground">Visão geral de todos os sistemas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Timer className="w-4 h-4 mr-2" />
            Iniciar Timer
          </Button>
          <Button>
            Nova Demanda
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plataformas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.platforms_count}</div>
            <p className="text-xs text-muted-foreground">sistemas ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.clients_count}</div>
            <p className="text-xs text-muted-foreground">clientes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instâncias</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.instances_count}</div>
            <p className="text-xs text-muted-foreground">ambientes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.contracts_count}</div>
            <p className="text-xs text-muted-foreground">contratos ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {Number(data.summary.total_mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">receita recorrente mensal</p>
          </CardContent>
        </Card>
      </div>

      {/* Horas da Semana */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horas da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around">
              <div className="text-center">
                <div className="text-3xl font-bold">{Number(data.weekly_hours.total_hours).toFixed(1)}h</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{Number(data.weekly_hours.billable_hours).toFixed(1)}h</div>
                <p className="text-sm text-muted-foreground">Faturáveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demandas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={demandsPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {demandsPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* MRR por Plataforma */}
      {mrrByPlatform.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>MRR por Plataforma</CardTitle>
            <CardDescription>Receita recorrente mensal por sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mrrByPlatform}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                <Bar dataKey="total_mrr" fill="#8884d8" name="MRR" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Demandas Recentes e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Demandas Recentes</CardTitle>
            <CardDescription>Últimas demandas abertas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_demands.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma demanda aberta</p>
              ) : (
                data.recent_demands.map((demand) => (
                  <div key={demand.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{demand.demand_number}</span>
                        <Badge variant="outline">{typeLabels[demand.type] || demand.type}</Badge>
                        <span className={`w-2 h-2 rounded-full ${priorityColors[demand.priority]}`}></span>
                      </div>
                      <p className="font-medium truncate">{demand.title}</p>
                      <p className="text-sm text-muted-foreground">{demand.client_name} - {demand.instance_name}</p>
                    </div>
                    <Badge>{statusLabels[demand.status] || demand.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <div className="space-y-4">
          {/* Contratos Expirando */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Contratos Expirando
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.expiring_contracts.length === 0 ? (
                <p className="text-muted-foreground text-center py-2">Nenhum contrato expirando</p>
              ) : (
                <div className="space-y-2">
                  {data.expiring_contracts.map((contract) => (
                    <div key={contract.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{contract.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence em {new Date(contract.end_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="font-bold">R$ {Number(contract.mrr_value).toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Faturas Pendentes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <DollarSign className="h-5 w-5" />
                Faturas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.pending_invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-2">Nenhuma fatura pendente</p>
              ) : (
                <div className="space-y-2">
                  {data.pending_invoices.map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{invoice.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.invoice_number} - Vence {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">R$ {Number(invoice.total).toLocaleString('pt-BR')}</span>
                        <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'} className="ml-2">
                          {invoice.status === 'overdue' ? 'Vencida' : 'Enviada'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
