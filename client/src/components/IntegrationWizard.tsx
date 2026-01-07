import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Step {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

export function IntegrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');

  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Conectar com Mercado Livre',
      description: 'Autorize o acesso à sua conta do Mercado Livre',
      status: 'current'
    },
    {
      id: 2,
      title: 'Sincronizar Produtos',
      description: 'Importar seus produtos e anúncios ativos',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Sincronizar Pedidos',
      description: 'Importar pedidos e histórico de vendas',
      status: 'pending'
    },
    {
      id: 4,
      title: 'Configurar Automações',
      description: 'Ativar sincronização automática e alertas',
      status: 'pending'
    }
  ]);

  const progress = (currentStep / steps.length) * 100;

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Abrir janela de autenticação OAuth
      const response = await fetch('/api/mercadolivre/auth/url', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao obter URL de autenticação');
      }

      const { authUrl } = await response.json();

      // Abrir popup OAuth
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'Mercado Livre OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Aguardar callback
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          // Verificar se a conexão foi bem-sucedida
          checkConnectionStatus();
        }
      }, 500);

    } catch (error) {
      console.error('Erro ao conectar:', error);
      setConnectionStatus('error');
      toast.error('Erro ao conectar com Mercado Livre');
      updateStepStatus(1, 'error');
      setIsConnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/mercadolivre/status', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          setConnectionStatus('success');
          toast.success('Conectado com sucesso!');
          updateStepStatus(1, 'completed');
          setCurrentStep(2);
          // Iniciar sincronização automática
          await syncProducts();
        } else {
          setConnectionStatus('error');
          toast.error('Falha na autenticação');
          updateStepStatus(1, 'error');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setConnectionStatus('error');
      updateStepStatus(1, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const syncProducts = async () => {
    updateStepStatus(2, 'current');
    try {
      const response = await fetch('/api/mercadolivre/sync/products', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Produtos sincronizados!');
        updateStepStatus(2, 'completed');
        setCurrentStep(3);
        await syncOrders();
      } else {
        throw new Error('Erro ao sincronizar produtos');
      }
    } catch (error) {
      console.error('Erro ao sincronizar produtos:', error);
      toast.error('Erro ao sincronizar produtos');
      updateStepStatus(2, 'error');
    }
  };

  const syncOrders = async () => {
    updateStepStatus(3, 'current');
    try {
      const response = await fetch('/api/mercadolivre/sync/orders', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Pedidos sincronizados!');
        updateStepStatus(3, 'completed');
        setCurrentStep(4);
        await setupAutomations();
      } else {
        throw new Error('Erro ao sincronizar pedidos');
      }
    } catch (error) {
      console.error('Erro ao sincronizar pedidos:', error);
      toast.error('Erro ao sincronizar pedidos');
      updateStepStatus(3, 'error');
    }
  };

  const setupAutomations = async () => {
    updateStepStatus(4, 'current');
    try {
      const response = await fetch('/api/mercadolivre/automations/enable', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoSync: true,
          stockAlerts: true,
          orderNotifications: true
        })
      });

      if (response.ok) {
        toast.success('Automações configuradas!');
        updateStepStatus(4, 'completed');
        toast.success('Integração concluída com sucesso! 🎉');
      } else {
        throw new Error('Erro ao configurar automações');
      }
    } catch (error) {
      console.error('Erro ao configurar automações:', error);
      toast.error('Erro ao configurar automações');
      updateStepStatus(4, 'error');
    }
  };

  const updateStepStatus = (stepId: number, status: Step['status']) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const getStepIcon = (step: Step) => {
    if (step.status === 'completed') {
      return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    }
    if (step.status === 'current') {
      return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
    }
    if (step.status === 'error') {
      return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
    return <Circle className="w-6 h-6 text-gray-300" />;
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Assistente de Integração</h2>
          <p className="text-gray-600">
            Siga os passos abaixo para conectar sua conta do Mercado Livre
          </p>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Lista de Passos */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                step.status === 'current'
                  ? 'border-blue-500 bg-blue-50'
                  : step.status === 'completed'
                  ? 'border-green-500 bg-green-50'
                  : step.status === 'error'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {getStepIcon(step)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          {currentStep === 1 && connectionStatus !== 'success' && (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Conectar com Mercado Livre
                </>
              )}
            </Button>
          )}

          {currentStep === 4 && steps[3].status === 'completed' && (
            <Button
              onClick={() => window.location.href = '/'}
              className="flex-1"
              size="lg"
            >
              Ir para o Dashboard
            </Button>
          )}
        </div>

        {/* Ajuda */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Dica</h4>
          <p className="text-sm text-blue-800">
            Certifique-se de que você tem permissões de administrador na sua conta do Mercado Livre
            para autorizar o acesso completo aos seus dados.
          </p>
        </div>
      </Card>
    </div>
  );
}
