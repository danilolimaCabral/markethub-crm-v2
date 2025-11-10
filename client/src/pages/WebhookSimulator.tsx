/**
 * Simulador de Webhooks Asaas
 * Página para testar processamento de webhooks localmente
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { webhookProcessor } from '@/services/webhookProcessor';
import { AsaasWebhookPayload, AsaasWebhookEvent } from '@/types/asaas';
import { toast } from 'sonner';
import { Zap, Send, FileJson } from 'lucide-react';

export default function WebhookSimulator() {
  const [event, setEvent] = useState<AsaasWebhookEvent>('PAYMENT_RECEIVED');
  const [email, setEmail] = useState('teste@example.com');
  const [value, setValue] = useState('49.90');
  const [customPayload, setCustomPayload] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const eventOptions: { value: AsaasWebhookEvent; label: string }[] = [
    { value: 'SUBSCRIPTION_CREATED', label: 'Assinatura Criada' },
    { value: 'SUBSCRIPTION_UPDATED', label: 'Assinatura Atualizada' },
    { value: 'SUBSCRIPTION_DELETED', label: 'Assinatura Cancelada' },
    { value: 'PAYMENT_CREATED', label: 'Pagamento Criado' },
    { value: 'PAYMENT_CONFIRMED', label: 'Pagamento Confirmado' },
    { value: 'PAYMENT_RECEIVED', label: 'Pagamento Recebido ✅' },
    { value: 'PAYMENT_OVERDUE', label: 'Pagamento Vencido ⚠️' },
    { value: 'PAYMENT_REFUNDED', label: 'Pagamento Estornado ❌' },
    { value: 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED', label: 'Cartão Recusado' },
  ];

  const generatePayload = (): AsaasWebhookPayload => {
    const basePayload: AsaasWebhookPayload = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event,
      dateCreated: new Date().toISOString(),
    };

    // Eventos de assinatura
    if (event.startsWith('SUBSCRIPTION_')) {
      basePayload.subscription = {
        id: `sub_${Math.random().toString(36).substr(2, 9)}`,
        customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
        value: parseFloat(value),
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cycle: 'MONTHLY',
        status: event === 'SUBSCRIPTION_DELETED' ? 'INACTIVE' : 'ACTIVE',
        billingType: 'CREDIT_CARD',
        description: 'MarketHub CRM - Plano Starter',
        externalReference: email,
      };
    }

    // Eventos de pagamento
    if (event.startsWith('PAYMENT_')) {
      basePayload.payment = {
        id: `pay_${Math.random().toString(36).substr(2, 9)}`,
        customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
        subscription: `sub_${Math.random().toString(36).substr(2, 9)}`,
        value: parseFloat(value),
        netValue: parseFloat(value) * 0.95, // 5% de taxa
        status: event === 'PAYMENT_RECEIVED' ? 'RECEIVED' : 
                event === 'PAYMENT_CONFIRMED' ? 'CONFIRMED' :
                event === 'PAYMENT_OVERDUE' ? 'OVERDUE' :
                event === 'PAYMENT_REFUNDED' ? 'REFUNDED' : 'PENDING',
        billingType: 'CREDIT_CARD',
        confirmedDate: new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString().split('T')[0],
        creditDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        externalReference: email,
      };
    }

    return basePayload;
  };

  const handleSimulate = async () => {
    try {
      let payload: AsaasWebhookPayload;

      if (useCustom && customPayload) {
        payload = JSON.parse(customPayload);
      } else {
        payload = generatePayload();
      }

      console.log('Simulando webhook:', payload);
      
      await webhookProcessor.processWebhook(payload);
      
      toast.success('Webhook processado!', {
        description: `Evento ${event} foi processado com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      toast.error('Erro ao processar webhook', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const handleGenerateJson = () => {
    const payload = generatePayload();
    setCustomPayload(JSON.stringify(payload, null, 2));
    setUseCustom(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Simulador de Webhooks Asaas</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Teste o processamento de eventos localmente
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurar Evento</CardTitle>
            <CardDescription>
              Selecione o tipo de evento e configure os parâmetros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <Select value={event} onValueChange={(v) => setEvent(v as AsaasWebhookEvent)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Email do Cliente</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="49.90"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSimulate} className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                Simular Webhook
              </Button>
              <Button onClick={handleGenerateJson} variant="outline">
                <FileJson className="w-4 h-4 mr-2" />
                Gerar JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {useCustom && (
          <Card>
            <CardHeader>
              <CardTitle>Payload Personalizado</CardTitle>
              <CardDescription>
                Edite o JSON do webhook manualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                rows={15}
                className="font-mono text-sm"
                placeholder="Cole ou edite o JSON do webhook aqui"
              />
              <div className="flex gap-2">
                <Button onClick={handleSimulate} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Processar JSON Personalizado
                </Button>
                <Button onClick={() => setUseCustom(false)} variant="outline">
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              ℹ️ Como usar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
            <p>1. Selecione o tipo de evento que deseja simular</p>
            <p>2. Configure o email e valor do pagamento</p>
            <p>3. Clique em "Simular Webhook" para processar</p>
            <p>4. Verifique as notificações e logs no console</p>
            <p className="mt-4 font-semibold">
              💡 Eventos importantes:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>PAYMENT_RECEIVED:</strong> Ativa acesso do cliente</li>
              <li><strong>PAYMENT_OVERDUE:</strong> Marca como vencido</li>
              <li><strong>SUBSCRIPTION_DELETED:</strong> Cancela assinatura</li>
              <li><strong>PAYMENT_REFUNDED:</strong> Estorna e cancela</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
