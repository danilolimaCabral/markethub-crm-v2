import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Server,
  Cpu,
  HardDrive,
  Clock,
  LogOut,
  RefreshCw,
  Database,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardData {
  stats: {
    total_tenants: number;
    active_tenants: number;
    trial_tenants: number;
    suspended_tenants: number;
    cancelled_tenants: number;
    total_errors_24h: number;
    total_users: number;
    total_products: number;
    total_orders: number;
    total_revenue: number;
  };
  system_metrics: {
    cpu_usage: number;
    memory_usage: number;
    memory_total: number;
    memory_external: number;
    uptime_hours: number;
    uptime_days: number;
    platform: string;
    hostname: string;
    node_version: string;
    total_memory: number;
    free_memory: number;
    cpu_count: number;
    load_average: number[];
    database: {
      total_connections: number;
      active_connections: number;
      idle_connections: number;
    };
    usage: {
      total_users: number;
      total_products: number;
      total_orders: number;
      total_revenue: number;
    };
    top_tenants: Array<{
      id: string;
      nome_empresa: string;
      slug: string;
      status: string;
      plano: string;
      orders_count: number;
      revenue: number;
    }>;
  };
  plan_stats: Array<{
    plano: string;
    count: number;
    total_users: number;
    total_products: number;
    total_orders: number;
  }>;
  errors_by_tenant: any[];
  recent_logs: any[];
}

export default function SuperAdminDashboard() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (showToast = false) => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('superadmin_token');
      
      if (!token) {
        setLocation('/super-admin/login');
        return;
      }

      const response = await fetch('/api/superadmin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        toast.error('Sessão expirada');
        localStorage.removeItem('superadmin_token');
        setLocation('/super-admin/login');
        return;
      }

      const result = await response.json();
      setData(result);
      
      if (showToast) {
        toast.success('Dashboard atualizado!');
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => fetchDashboard(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
    toast.success('Logout realizado');
    setLocation('/super-admin/login');
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getLevelBadge = (level: string) => {
    const variants: any = {
      info: 'bg-blue-500/10 text-blue-700 border-blue-200',
      warning: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      error: 'bg-red-500/10 text-red-700 border-red-200',
      critical: 'bg-purple-500/10 text-purple-700 border-purple-200'
    };
    return variants[level] || variants.info;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Super Admin Panel</h1>
            <p className="text-slate-400 text-sm">Monitoramento e gestão do sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.stats.total_tenants}</div>
            <p className="text-xs text-slate-400 mt-1">
              {data.stats.active_tenants} ativos • {data.stats.trial_tenants} trial
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.stats.total_users || 0}</div>
            <p className="text-xs text-slate-400 mt-1">
              {data.stats.total_products || 0} produtos • {data.stats.total_orders || 0} pedidos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {data.stats.total_revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Todos os clientes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Erros (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.stats.total_errors_24h || 0}</div>
            <p className="text-xs text-slate-400 mt-1">
              {data.stats.total_errors_24h > 0 ? 'Requer atenção' : 'Sistema estável'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="w-5 h-5" />
              Métricas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  CPU
                </span>
                <span className="text-sm font-medium text-white">
                  {data.system_metrics.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(data.system_metrics.cpu_usage, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Memória
                </span>
                <span className="text-sm font-medium text-white">
                  {data.system_metrics.memory_usage.toFixed(1)} MB
                  <span className="text-slate-400 ml-2">
                    / {data.system_metrics.memory_total.toFixed(1)} MB
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((data.system_metrics.memory_usage / data.system_metrics.memory_total) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Memória Total</p>
                  <p className="text-sm font-medium text-white">
                    {data.system_metrics.total_memory?.toFixed(1) || 'N/A'} GB
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Memória Livre</p>
                  <p className="text-sm font-medium text-white">
                    {data.system_metrics.free_memory?.toFixed(1) || 'N/A'} GB
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">CPU Cores</p>
                  <p className="text-sm font-medium text-white">
                    {data.system_metrics.cpu_count || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Uptime</p>
                  <p className="text-sm font-medium text-white">
                    {data.system_metrics.uptime_days?.toFixed(1) || '0'} dias
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Plataforma</p>
                  <p className="text-sm font-medium text-white">{data.system_metrics.platform}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Hostname</p>
                  <p className="text-sm font-medium text-white">{data.system_metrics.hostname}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Banco de Dados</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Total:</span>
                    <span className="text-white ml-1 font-medium">{data.system_metrics.database?.total_connections || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Ativas:</span>
                    <span className="text-green-400 ml-1 font-medium">{data.system_metrics.database?.active_connections || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Idle:</span>
                    <span className="text-yellow-400 ml-1 font-medium">{data.system_metrics.database?.idle_connections || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Erros por Tenant (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.errors_by_tenant.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  Nenhum erro registrado 🎉
                </p>
              ) : (
                data.errors_by_tenant.slice(0, 10).map((tenant: any) => (
                  <div key={tenant.tenant_id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{tenant.tenant_name}</p>
                      <p className="text-xs text-slate-400">
                        {tenant.errors} erros, {tenant.warnings} avisos
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {tenant.critical_errors > 0 && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">
                          {tenant.critical_errors} críticos
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Tenants e Estatísticas por Plano */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Clientes Mais Ativos (7 dias)
            </CardTitle>
            <CardDescription className="text-slate-400">
              Top 10 clientes por pedidos e receita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {data.system_metrics.top_tenants?.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  Nenhum dado disponível
                </p>
              ) : (
                data.system_metrics.top_tenants?.map((tenant: any, index: number) => (
                  <div key={tenant.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{tenant.nome_empresa}</p>
                        <p className="text-xs text-slate-400">
                          {tenant.plano} • {tenant.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {tenant.orders_count || 0} pedidos
                      </p>
                      <p className="text-xs text-green-400">
                        R$ {parseFloat(tenant.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Estatísticas por Plano
            </CardTitle>
            <CardDescription className="text-slate-400">
              Distribuição de clientes e uso por plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.plan_stats?.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  Nenhum dado disponível
                </p>
              ) : (
                data.plan_stats?.map((plan: any) => (
                  <div key={plan.plano} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white capitalize">{plan.plano}</span>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500">
                        {plan.count} clientes
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Usuários:</span>
                        <span className="text-white ml-1 font-medium">{plan.total_users || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Produtos:</span>
                        <span className="text-white ml-1 font-medium">{plan.total_products || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Pedidos:</span>
                        <span className="text-white ml-1 font-medium">{plan.total_orders || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            Logs Recentes
          </CardTitle>
          <CardDescription className="text-slate-400">
            Últimas 10 entradas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Nível</TableHead>
                <TableHead className="text-slate-300">Categoria</TableHead>
                <TableHead className="text-slate-300">Mensagem</TableHead>
                <TableHead className="text-slate-300">Tenant</TableHead>
                <TableHead className="text-slate-300">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recent_logs.map((log: any) => (
                <TableRow key={log.id} className="border-slate-700">
                  <TableCell>
                    <Badge variant="outline" className={getLevelBadge(log.level)}>
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{log.category}</TableCell>
                  <TableCell className="text-slate-300 max-w-md truncate">{log.message}</TableCell>
                  <TableCell className="text-slate-300">{log.tenant_id || '-'}</TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
