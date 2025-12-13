import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Package,
  DollarSign,
  ShoppingCart,
  Database
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: 'marketplace' | 'payment' | 'api';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  itemsSynced?: number;
  error?: string;
  connectUrl?: string;
}

interface IntegrationStatus {
  marketplaces: Integration[];
  payments: Integration[];
  apis: Integration[];
}

export default function StatusIntegracoes() {
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    marketplaces: [],
    payments: [],
    apis: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/integrations/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Erro ao buscar status das integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'disconnected':
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'error':
        return <Badge className="bg-yellow-100 text-yellow-800">Com Erro</Badge>;
      case 'disconnected':
      default:
        return <Badge className="bg-red-100 text-red-800">Desconectado</Badge>;
    }
  };

  const renderIntegrationCard = (integration: Integration) => (
    <Card key={integration.id} className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {getStatusIcon(integration.status)}
          <div>
            <h3 className="font-semibold text-gray-900">{integration.name}</h3>
            <div className="mt-2 space-y-1">
              {integration.lastSync && (
                <p className="text-sm text-gray-600">
                  Última sincronização: {new Date(integration.lastSync).toLocaleString('pt-BR')}
                </p>
              )}
              {integration.itemsSynced !== undefined && (
                <p className="text-sm text-gray-600">
                  Itens sincronizados: {integration.itemsSynced}
                </p>
              )}
              {integration.error && (
                <p className="text-sm text-red-600">
                  Erro: {integration.error}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(integration.status)}
          {integration.status === 'disconnected' && integration.connectUrl && (
            <Button 
              size="sm" 
              onClick={() => window.location.href = integration.connectUrl!}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Conectar
            </Button>
          )}
          {integration.status === 'connected' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={fetchIntegrationStatus}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalIntegrations = 
    integrations.marketplaces.length + 
    integrations.payments.length + 
    integrations.apis.length;

  const connectedIntegrations = [
    ...integrations.marketplaces,
    ...integrations.payments,
    ...integrations.apis
  ].filter(i => i.status === 'connected').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Status das Integrações</h1>
          <p className="text-gray-600 mt-1">
            Monitore todas as integrações e APIs do sistema
          </p>
        </div>
        <Button onClick={fetchIntegrationStatus}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar Tudo
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Integrações</p>
              <p className="text-2xl font-bold text-gray-900">{totalIntegrations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conectadas</p>
              <p className="text-2xl font-bold text-gray-900">{connectedIntegrations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Desconectadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalIntegrations - connectedIntegrations}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Marketplaces */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Marketplaces</h2>
        </div>
        <div className="space-y-3">
          {integrations.marketplaces.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              Nenhuma integração de marketplace configurada
            </Card>
          ) : (
            integrations.marketplaces.map(renderIntegrationCard)
          )}
        </div>
      </div>

      {/* Payment Gateways */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Gateways de Pagamento</h2>
        </div>
        <div className="space-y-3">
          {integrations.payments.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              Nenhuma integração de pagamento configurada
            </Card>
          ) : (
            integrations.payments.map(renderIntegrationCard)
          )}
        </div>
      </div>

      {/* System APIs */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">APIs do Sistema</h2>
        </div>
        <div className="space-y-3">
          {integrations.apis.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              Nenhuma API configurada
            </Card>
          ) : (
            integrations.apis.map(renderIntegrationCard)
          )}
        </div>
      </div>
    </div>
  );
}
