/**
 * Dashboard Admin Master - Mercado Livre
 * Visualiza status de todas as integrações ML de todos os usuários
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Users, 
  RefreshCw,
  Clock,
  TrendingUp
} from 'lucide-react';

interface MLIntegration {
  id: number;
  tenant: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
  };
  mercadolivre: {
    user_id: string;
    nickname: string;
  };
  status: {
    connected: boolean;
    token_valid: boolean;
    token_expires_at: string;
    last_sync: string | null;
  };
  timestamps: {
    created_at: string;
    updated_at: string;
  };
}

interface Stats {
  total: number;
  connected: number;
  disconnected: number;
  token_expired: number;
}

export default function MLAdminDashboard() {
  const [integrations, setIntegrations] = useState<MLIntegration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/mercadolivre/all-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const data = await response.json();
      setIntegrations(data.integrations);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusBadge = (integration: MLIntegration) => {
    if (!integration.status.connected) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
    }
    if (!integration.status.token_valid) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Token Expirado</Badge>;
    }
    return <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1" />Conectado</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integrações Mercado Livre</h2>
          <p className="text-muted-foreground">Visualização de todas as conexões dos clientes</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Integrações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conectados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.connected / stats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desconectados</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.disconnected}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.disconnected / stats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Expirados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.token_expired}</div>
              <p className="text-xs text-muted-foreground">Precisam reconectar</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Integrações */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Integrações</CardTitle>
          <CardDescription>
            Status detalhado de cada cliente conectado ao Mercado Livre
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma integração encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      {/* Usuário */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{integration.user.name}</h4>
                          {getStatusBadge(integration)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {integration.user.email} • @{integration.user.username}
                        </p>
                      </div>

                      {/* Tenant */}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Tenant:</span>{' '}
                        <span className="font-medium">{integration.tenant.name}</span>
                      </div>

                      {/* Mercado Livre */}
                      {integration.mercadolivre.nickname && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">ML:</span>{' '}
                          <span className="font-medium">@{integration.mercadolivre.nickname}</span>
                          <span className="text-muted-foreground ml-2">
                            (ID: {integration.mercadolivre.user_id})
                          </span>
                        </div>
                      )}

                      {/* Datas */}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Última sync: {formatDate(integration.status.last_sync)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Token expira: {formatDate(integration.status.token_expires_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
