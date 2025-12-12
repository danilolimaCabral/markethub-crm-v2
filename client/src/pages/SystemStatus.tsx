import { useState, useEffect } from 'react';
import { Activity, Database, Zap, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SystemStatus {
  timestamp: string;
  server: {
    status: string;
    uptime: number;
    memory: any;
    nodeVersion: string;
  };
  database: {
    status: string;
    connected: boolean;
    responseTime?: string;
    error?: string;
  };
  integrations: {
    mercadoLivre: {
      configured: boolean;
      connected: boolean;
      hasToken: boolean;
    };
    stripe: {
      configured: boolean;
    };
    redis: {
      configured: boolean;
      connected: boolean;
    };
    sentry: {
      configured: boolean;
    };
  };
  apis: Record<string, { status: string; endpoint: string }>;
}

interface Integration {
  name: string;
  id: string;
  configured: boolean;
  status: string;
  icon: string;
  description: string;
  docs: string;
}

export default function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      setLoading(true);
      
      // Buscar status do sistema
      const statusRes = await fetch('/api/system/status');
      const statusData = await statusRes.json();
      setStatus(statusData);

      // Buscar integrações
      const integrationsRes = await fetch('/api/system/integrations');
      const integrationsData = await integrationsRes.json();
      setIntegrations(integrationsData.integrations || []);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string, configured?: boolean) => {
    if (configured === false) {
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
    
    switch (status) {
      case 'ok':
      case 'online':
      case 'connected':
      case 'configured':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string, configured?: boolean) => {
    if (configured === false) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Não Configurado</span>;
    }
    
    switch (status) {
      case 'ok':
      case 'online':
      case 'connected':
      case 'configured':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Online</span>;
      case 'error':
      case 'offline':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Erro</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Atenção</span>;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Status do Sistema</h1>
          <p className="text-gray-600 mt-1">Monitoramento em tempo real de todas as APIs e integrações</p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Última atualização */}
      <div className="text-sm text-gray-500">
        Última atualização: {lastUpdate.toLocaleString('pt-BR')}
      </div>

      {/* Cards de Status Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Servidor */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Servidor</h3>
                <p className="text-sm text-gray-600">Node.js {status?.server.nodeVersion}</p>
              </div>
            </div>
            {getStatusIcon(status?.server.status || 'unknown')}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-medium">{formatUptime(status?.server.uptime || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memória (RSS):</span>
              <span className="font-medium">{formatMemory(status?.server.memory.rss || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heap:</span>
              <span className="font-medium">{formatMemory(status?.server.memory.heapUsed || 0)}</span>
            </div>
          </div>
        </div>

        {/* Banco de Dados */}
        <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${status?.database.connected ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className={`w-8 h-8 ${status?.database.connected ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <h3 className="font-semibold text-gray-900">Banco de Dados</h3>
                <p className="text-sm text-gray-600">PostgreSQL</p>
              </div>
            </div>
            {getStatusIcon(status?.database.status || 'unknown')}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              {getStatusBadge(status?.database.status || 'unknown')}
            </div>
            {status?.database.responseTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tempo de resposta:</span>
                <span className="font-medium">{status.database.responseTime}</span>
              </div>
            )}
            {status?.database.error && (
              <div className="text-red-600 text-xs mt-2">{status.database.error}</div>
            )}
          </div>
        </div>

        {/* Integrações Configuradas */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Integrações</h3>
                <p className="text-sm text-gray-600">Marketplaces & Serviços</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">{integrations.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Configuradas:</span>
              <span className="font-medium text-green-600">
                {integrations.filter(i => i.configured).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pendentes:</span>
              <span className="font-medium text-gray-500">
                {integrations.filter(i => !i.configured).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Integrações Detalhadas */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Integrações Disponíveis</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className={`p-4 border rounded-lg ${
                  integration.configured
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{integration.icon}</span>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                  </div>
                  {getStatusIcon(integration.status, integration.configured)}
                </div>
                <p className="text-sm text-gray-600 mb-3">{integration.description}</p>
                {getStatusBadge(integration.status, integration.configured)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* APIs Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Status das APIs</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {status && Object.entries(status.apis).map(([key, api]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 capitalize">{key}</div>
                  <div className="text-xs text-gray-500">{api.endpoint}</div>
                </div>
                {getStatusIcon(api.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
