import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, TrendingUp, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { asaasService } from '@/services/asaasService';
import { subscriptionService } from '@/services/subscriptionService';
import { PLANS } from '@/types/asaas';

const PLANOS = [
  {
    id: 'starter',
    nome: 'Starter',
    preco: 49,
    descricao: 'Ideal para quem está começando',
    recursos: [
      '1 marketplace integrado',
      'Até 100 produtos',
      'Calculadora de taxas',
      'Alertas de estoque',
      'Suporte por email'
    ]
  },
  {
    id: 'professional',
    nome: 'Professional',
    preco: 99,
    descricao: 'Para pequenas empresas',
    popular: true,
    recursos: [
      '3 marketplaces integrados',
      'Até 500 produtos',
      'Calculadora avançada',
      'Alertas automáticos',
      'Análise financeira (CMV)',
      'Suporte prioritário'
    ]
  },
  {
    id: 'business',
    nome: 'Business',
    preco: 199,
    descricao: 'Para operações complexas',
    recursos: [
      '5 marketplaces integrados',
      'Produtos ilimitados',
      'Todas as funcionalidades',
      'Relatórios avançados',
      'IA de precificação',
      'Suporte 24/7'
    ]
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 399,
    descricao: 'Para grandes operações',
    recursos: [
      'Marketplaces ilimitados',
      'Produtos ilimitados',
      'API dedicada',
      'Customizações',
      'Gerente de conta',
      'SLA 99.9%'
    ]
  }
];

export default function Cadastro() {
  const [, setLocation] = useLocation();
  const [etapa, setEtapa] = useState<'plano' | 'dados'>('plano');
  const [planoSelecionado, setPlanoSelecionado] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    nomeCompleto: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: ''
  });

  const handleSelecionarPlano = (planoId: string) => {
    setPlanoSelecionado(planoId);
    setEtapa('dados');
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.senha.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Buscar configuração do plano
      const planConfig = PLANS[planoSelecionado];
      if (!planConfig) {
        throw new Error('Plano inválido');
      }

      toast.info('Criando sua conta...', { duration: 2000 });

      // 1. Criar cliente e assinatura no Asaas
      const { customer, subscription } = await asaasService.createSubscriptionWithTrial(
        {
          name: formData.nomeCompleto,
          email: formData.email,
          cpfCnpj: '00000000000', // Será preenchido depois
          phone: formData.telefone,
        },
        {
          name: planConfig.name,
          value: planConfig.value,
        }
      );

      toast.success('Assinatura criada no Asaas!', { duration: 2000 });

      // 2. Criar usuário local
      const userId = `user_${Date.now()}`;
      const novoUsuario = {
        id: userId,
        nome: formData.nomeCompleto,
        email: formData.email,
        senha: formData.senha, // Em produção, usar hash
        role: 'admin',
        criadoEm: new Date().toISOString(),
      };

      localStorage.setItem('markethub_user', JSON.stringify(novoUsuario));

      // 3. Salvar assinatura local
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      subscriptionService.saveSubscription({
        id: subscription.id!,
        userId,
        email: formData.email,
        plan: planoSelecionado as any,
        status: 'trial',
        asaasCustomerId: customer.id!,
        asaasSubscriptionId: subscription.id!,
        trialEndsAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 4. Salvar tenant
      const novoTenant = {
        id: `tenant_${Date.now()}`,
        nomeEmpresa: formData.nomeEmpresa,
        plano: planoSelecionado,
        email: formData.email,
        telefone: formData.telefone,
        status: 'trial',
        criadoEm: new Date().toISOString(),
        trialAte: trialEndsAt.toISOString(),
      };

      localStorage.setItem('markethub_tenant', JSON.stringify(novoTenant));

      toast.success('Conta criada com sucesso! 🎉', {
        description: '14 dias de trial grátis ativados',
      });
      
      // Redirecionar para onboarding
      setTimeout(() => {
        setLocation('/onboarding');
      }, 1500);

    } catch (error) {
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation('/')}>
              <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                  MarketHub CRM
                </span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">
                  Venda mais, lucre mais
                </span>
              </div>
            </div>
            
            <Button variant="ghost" onClick={() => setLocation('/login')}>
              Já tenho conta
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => etapa === 'dados' ? setEtapa('plano') : setLocation('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Etapa 1: Seleção de Plano */}
        {etapa === 'plano' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">
                Escolha seu plano
              </h1>
              <p className="text-xl text-muted-foreground">
                14 dias grátis • Sem cartão de crédito • Cancele quando quiser
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLANOS.map((plano) => (
                <Card
                  key={plano.id}
                  className={`relative hover:shadow-xl transition-all duration-300 cursor-pointer ${
                    plano.popular ? 'border-2 border-purple-500 shadow-lg' : ''
                  }`}
                  onClick={() => handleSelecionarPlano(plano.id)}
                >
                  {plano.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                    <CardDescription>{plano.descricao}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">R$ {plano.preco}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Button
                      className="w-full mb-4"
                      variant={plano.popular ? 'default' : 'outline'}
                    >
                      Começar Agora
                    </Button>
                    
                    <ul className="space-y-2">
                      {plano.recursos.map((recurso, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{recurso}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Etapa 2: Dados do Cadastro */}
        {etapa === 'dados' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">Crie sua conta</CardTitle>
                <CardDescription>
                  Plano selecionado: <strong>{PLANOS.find(p => p.id === planoSelecionado)?.nome}</strong> - 
                  R$ {PLANOS.find(p => p.id === planoSelecionado)?.preco}/mês
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleCadastro} className="space-y-6">
                  {/* Dados da Empresa */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Dados da Empresa</h3>
                    
                    <div>
                      <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
                      <Input
                        id="nomeEmpresa"
                        required
                        value={formData.nomeEmpresa}
                        onChange={(e) => setFormData({...formData, nomeEmpresa: e.target.value})}
                        placeholder="Minha Loja Online"
                      />
                    </div>
                  </div>

                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Seus Dados</h3>
                    
                    <div>
                      <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                      <Input
                        id="nomeCompleto"
                        required
                        value={formData.nomeCompleto}
                        onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})}
                        placeholder="João Silva"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="joao@minhaloja.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="telefone">WhatsApp *</Label>
                      <Input
                        id="telefone"
                        required
                        value={formData.telefone}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                        placeholder="(11) 98765-4321"
                      />
                    </div>
                  </div>

                  {/* Senha */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Crie sua Senha</h3>
                    
                    <div>
                      <Label htmlFor="senha">Senha *</Label>
                      <Input
                        id="senha"
                        type="password"
                        required
                        minLength={8}
                        value={formData.senha}
                        onChange={(e) => setFormData({...formData, senha: e.target.value})}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                      <Input
                        id="confirmarSenha"
                        type="password"
                        required
                        value={formData.confirmarSenha}
                        onChange={(e) => setFormData({...formData, confirmarSenha: e.target.value})}
                        placeholder="Digite a senha novamente"
                      />
                    </div>
                  </div>

                  {/* Termos */}
                  <div className="text-sm text-muted-foreground">
                    Ao criar sua conta, você concorda com nossos{' '}
                    <a href="#" className="text-purple-600 hover:underline">Termos de Uso</a> e{' '}
                    <a href="#" className="text-purple-600 hover:underline">Política de Privacidade</a>.
                  </div>

                  {/* Botão */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-lg py-6"
                    disabled={loading}
                  >
                    {loading ? 'Criando sua conta...' : 'Começar Trial de 14 Dias'}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    ✅ Sem cartão de crédito • Cancele quando quiser
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
