import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Check, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

const ETAPAS = [
  {
    id: 1,
    titulo: 'Bem-vindo ao MarketHub CRM!',
    descricao: 'Vamos configurar sua conta em 3 minutos',
    icone: '👋'
  },
  {
    id: 2,
    titulo: 'Conecte seu Mercado Livre',
    descricao: 'A IA vai importar seus produtos automaticamente',
    icone: '🔗'
  },
  {
    id: 3,
    titulo: 'Configure impostos',
    descricao: 'Informe seu estado e regime tributário',
    icone: '💰'
  },
  {
    id: 4,
    titulo: 'Tudo pronto!',
    descricao: 'Sua conta está configurada e pronta para usar',
    icone: '🎉'
  }
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processandoIA, setProcessandoIA] = useState(false);
  
  const [config, setConfig] = useState({
    mercadoLivreToken: '',
    estado: 'GO',
    regimeTributario: 'simples'
  });

  const progresso = (etapaAtual / ETAPAS.length) * 100;

  // Simular processamento da IA
  const processarComIA = async (mensagem: string, tempo: number = 3000) => {
    setProcessandoIA(true);
    toast.info(`🤖 IA: ${mensagem}`);
    await new Promise(resolve => setTimeout(resolve, tempo));
    setProcessandoIA(false);
  };

  const handleProximaEtapa = async () => {
    setLoading(true);

    try {
      if (etapaAtual === 2) {
        // Simular conexão com Mercado Livre
        await processarComIA('Conectando com Mercado Livre...', 2000);
        await processarComIA('Importando produtos automaticamente...', 3000);
        await processarComIA('Calculando taxas de cada produto...', 2000);
        toast.success('✅ 47 produtos importados com sucesso!');
      }

      if (etapaAtual === 3) {
        // Simular configuração de impostos
        await processarComIA('Configurando cálculos de ICMS...', 1500);
        await processarComIA('Aplicando regime tributário...', 1500);
        toast.success('✅ Impostos configurados!');
      }

      if (etapaAtual === 4) {
        // Finalizar onboarding
        await processarComIA('Criando seu dashboard personalizado...', 2000);
        await processarComIA('Ativando alertas inteligentes...', 1500);
        
        // Salvar onboarding completo
        const tenant = JSON.parse(localStorage.getItem('markethub_tenant') || '{}');
        tenant.onboardingCompleto = true;
        tenant.configuracoes = config;
        localStorage.setItem('markethub_tenant', JSON.stringify(tenant));
        
        toast.success('🎉 Sua conta está pronta!');
        setTimeout(() => {
          setLocation('/dashboard');
        }, 2000);
        return;
      }

      setEtapaAtual(etapaAtual + 1);
    } finally {
      setLoading(false);
    }
  };

  const handlePular = () => {
    if (etapaAtual < ETAPAS.length) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const etapa = ETAPAS[etapaAtual - 1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Progresso */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Etapa {etapaAtual} de {ETAPAS.length}</span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <Progress value={progresso} className="h-2" />
          </div>

          {/* Título da Etapa */}
          <div className="text-center">
            <div className="text-6xl mb-4">{etapa.icone}</div>
            <CardTitle className="text-3xl mb-2">{etapa.titulo}</CardTitle>
            <CardDescription className="text-lg">{etapa.descricao}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Etapa 1: Boas-vindas */}
          {etapaAtual === 1 && (
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Onboarding Automático com IA</h3>
                    <p className="text-sm text-muted-foreground">
                      Nossa inteligência artificial vai configurar tudo para você. 
                      Basta conectar seu Mercado Livre e pronto! A IA importa produtos, 
                      calcula taxas e configura alertas automaticamente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-purple-600">3min</div>
                  <div className="text-sm text-muted-foreground">Configuração</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-muted-foreground">Automático</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-muted-foreground">Trabalho manual</div>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Conectar Mercado Livre */}
          {etapaAtual === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="mlToken">Token de Acesso do Mercado Livre</Label>
                <Input
                  id="mlToken"
                  value={config.mercadoLivreToken}
                  onChange={(e) => setConfig({...config, mercadoLivreToken: e.target.value})}
                  placeholder="APP_USR-XXXXXXXX-XXXXXX-XXXXXXXX"
                  disabled={processandoIA}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <a href="#" className="text-purple-600 hover:underline">
                    Como obter meu token?
                  </a>
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">🤖 O que a IA vai fazer:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Importar todos os seus produtos
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Calcular taxas automaticamente
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Sincronizar estoque em tempo real
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Configurar alertas inteligentes
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Etapa 3: Configurar Impostos */}
          {etapaAtual === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="estado">Seu Estado</Label>
                <select
                  id="estado"
                  className="w-full border rounded-md p-2"
                  value={config.estado}
                  onChange={(e) => setConfig({...config, estado: e.target.value})}
                  disabled={processandoIA}
                >
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>

              <div>
                <Label htmlFor="regime">Regime Tributário</Label>
                <select
                  id="regime"
                  className="w-full border rounded-md p-2"
                  value={config.regimeTributario}
                  onChange={(e) => setConfig({...config, regimeTributario: e.target.value})}
                  disabled={processandoIA}
                >
                  <option value="simples">Simples Nacional</option>
                  <option value="presumido">Lucro Presumido</option>
                  <option value="real">Lucro Real</option>
                </select>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>🤖 IA detectou:</strong> ICMS de {config.estado === 'GO' ? '19%' : '18%'} para seu estado. 
                  Todos os cálculos serão ajustados automaticamente!
                </p>
              </div>
            </div>
          )}

          {/* Etapa 4: Finalização */}
          {etapaAtual === 4 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">✅ Configuração Completa!</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>47 produtos importados do Mercado Livre</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Taxas calculadas automaticamente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Alertas de estoque ativados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Dashboard personalizado criado</span>
                  </div>
                </div>
              </div>

              <div className="text-center p-6">
                <p className="text-lg mb-2">
                  Seu trial de <strong>14 dias</strong> começa agora!
                </p>
                <p className="text-sm text-muted-foreground">
                  Explore todas as funcionalidades sem compromisso
                </p>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            {etapaAtual < ETAPAS.length && (
              <Button
                variant="ghost"
                onClick={handlePular}
                disabled={loading || processandoIA}
                className="flex-1"
              >
                Pular
              </Button>
            )}
            <Button
              onClick={handleProximaEtapa}
              disabled={loading || processandoIA}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {loading || processandoIA ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processandoIA ? 'IA Processando...' : 'Aguarde...'}
                </>
              ) : etapaAtual === ETAPAS.length ? (
                'Ir para o Dashboard'
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
