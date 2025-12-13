import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Package,
  DollarSign,
  ShoppingCart,
  Database,
  Truck,
  CreditCard
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: 'marketplace' | 'payment' | 'logistics' | 'system';
  status: 'connected' | 'disconnected';
  description: string;
  lastSync?: string;
  itemsSynced?: number;
  connectUrl?: string;
  icon: string;
}

export default function StatusIntegracoes() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      
      // Dados mockados das integrações disponíveis
      const availableIntegrations: Integration[] = [
        // Marketplaces
        {
          id: 'mercadolivre',
          name: 'Mercado Livre',
          type: 'marketplace',
          status: 'disconnected',
          description: 'Sincronize produtos, pedidos e estoque',
          connectUrl: '/integracoes/mercadolivre',
          icon: 'mercadolivre'
        },
        {
          id: 'shopee',
          name: 'Shopee',
          type: 'marketplace',
          status: 'disconnected',
          description: 'Integração com Shopee (Em desenvolvimento)',
          icon: 'shopee'
        },
        {
          id: 'amazon',
          name: 'Amazon',
          type: 'marketplace',
          status: 'disconnected',
          description: 'Integração com Amazon SP-API (Em desenvolvimento)',
          icon: 'amazon'
        },
        {
          id: 'magalu',
          name: 'Magazine Luiza',
          type: 'marketplace',
          status: 'disconnected',
          description: 'Integração com Magalu Marketplace (Em desenvolvimento)',
          icon: 'magalu'
        },
        // Pagamento
        {
          id: 'pagbank',
          name: 'PagBank',
          type: 'payment',
          status: 'disconnected',
          description: 'Gateway de pagamento PagSeguro (Em desenvolvimento)',
          icon: 'pagbank'
        },
        {
          id: 'stripe',
          name: 'Stripe',
          type: 'payment',
          status: 'disconnected',
          description: 'Gateway de pagamento internacional (Planejado)',
          icon: 'stripe'
        },
        // Logística
        {
          id: 'correios',
          name: 'Correios',
          type: 'logistics',
          status: 'disconnected',
          description: 'Cálculo de frete e rastreamento (Em desenvolvimento)',
          icon: 'correios'
        },
        {
          id: 'melhorenvio',
          name: 'Melhor Envio',
          type: 'logistics',
          status: 'disconnected',
          description: 'Cotação e gestão de envios (Em desenvolvimento)',
          icon: 'melhorenvio'
        },
        {
          id: 'jadlog',
          name: 'Jadlog',
          type: 'logistics',
          status: 'disconnected',
          description: 'Transportadora Jadlog (Em desenvolvimento)',
          icon: 'jadlog'
        }
      ];

      setIntegrations(availableIntegrations);
    } catch (error) {
      console.error('Erro ao buscar status das integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'marketplace':
        return <ShoppingCart className="w-6 h-6" />;
      case 'payment':
        return <CreditCard className="w-6 h-6" />;
      case 'logistics':
        return <Truck className="w-6 h-6" />;
      case 'system':
        return <Database className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectada
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="outline" className="text-gray-600">
            <XCircle className="w-3 h-3 mr-1" />
            Desconectada
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderIntegrationCard = (integration: Integration) => (
    <Card key={integration.id} className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className={`p-3 rounded-lg ${
            integration.status === 'connected' 
              ? 'bg-green-100 text-green-600' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {getIcon(integration.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{integration.name}</h3>
              {getStatusBadge(integration.status)}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {integration.description}
            </p>
            {integration.lastSync && (
              <p className="text-xs text-gray-500">
                Última sincronização: {new Date(integration.lastSync).toLocaleString('pt-BR')}
              </p>
            )}
            {integration.itemsSynced !== undefined && (
              <p className="text-xs text-gray-500">
                Itens sincronizados: {integration.itemsSynced}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {integration.status === 'disconnected' && integration.connectUrl && (
            <Button 
              size="sm" 
              onClick={() => window.location.href = integration.connectUrl!}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Conectar
            </Button>
          )}
          {integration.status === 'disconnected' && !integration.connectUrl && (
            <Button 
              size="sm" 
              variant="outline"
              disabled
            >
              Em breve
            </Button>
          )}
          {integration.status === 'connected' && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={fetchIntegrationStatus}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
              >
                Desconectar
              </Button>
            </>
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

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const disconnectedCount = integrations.filter(i => i.status === 'disconnected').length;

  const marketplaces = integrations.filter(i => i.type === 'marketplace');
  const payments = integrations.filter(i => i.type === 'payment');
  const logistics = integrations.filter(i => i.type === 'logistics');
  const systems = integrations.filter(i => i.type === 'system');

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
              <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{connectedCount}</p>
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
              <p className="text-2xl font-bold text-gray-900">{disconnectedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Marketplaces */}
      {marketplaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Marketplaces</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {marketplaces.map(renderIntegrationCard)}
          </div>
        </div>
      )}

      {/* Gateways de Pagamento */}
      {payments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Gateways de Pagamento</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {payments.map(renderIntegrationCard)}
          </div>
        </div>
      )}

      {/* Logística */}
      {logistics.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Logística</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {logistics.map(renderIntegrationCard)}
          </div>
        </div>
      )}

      {/* APIs do Sistema */}
      {systems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">APIs do Sistema</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {systems.map(renderIntegrationCard)}
          </div>
        </div>
      )}
    </div>
  );
}
