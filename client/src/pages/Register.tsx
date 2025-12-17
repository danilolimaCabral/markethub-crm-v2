import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface Plan {
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: Record<string, boolean>;
  limits: {
    users: number;
    products: number;
    ordersPerMonth: number;
  };
  recommended?: boolean;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  // Form data
  const [cnpj, setCnpj] = useState('');
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);
  const [cnpjValidating, setCnpjValidating] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_empresa: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirm: '',
    plano: 'free'
  });

  const [plans, setPlans] = useState<Plan[]>([]);

  // Formatar CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  // Validar CNPJ no backend
  const validateCNPJ = async (cnpjValue: string) => {
    if (cnpjValue.replace(/\D/g, '').length !== 14) {
      setCnpjValid(null);
      return;
    }

    setCnpjValidating(true);
    try {
      const response = await fetch('/api/register/validate-cnpj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: cnpjValue })
      });
      const data = await response.json();
      setCnpjValid(data.valid);
      if (!data.valid) {
        setError(data.error);
      } else {
        setError('');
      }
    } catch (err) {
      setCnpjValid(false);
      setError('Erro ao validar CNPJ');
    } finally {
      setCnpjValidating(false);
    }
  };

  // Carregar planos
  const loadPlans = async () => {
    try {
      const response = await fetch('/api/register/plans');
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
  };

  // Avançar para próximo passo
  const nextStep = async () => {
    if (step === 1 && cnpjValid) {
      await loadPlans();
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Validar dados antes de enviar
      if (!formData.nome_empresa) {
        setError('Nome da empresa é obrigatório');
        return;
      }
      if (!formData.admin_email) {
        setError('Email do administrador é obrigatório');
        return;
      }
      if (formData.admin_password && formData.admin_password !== formData.admin_password_confirm) {
        setError('As senhas não coincidem');
        return;
      }
      setStep(4);
    }
  };

  // Submeter registro
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj,
          ...formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar empresa');
      }

      // Salvar tokens
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Mostrar credenciais se geradas automaticamente
      if (data.credentials) {
        setCredentials(data.credentials);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ir para o dashboard
  const goToDashboard = () => {
    setLocation('/dashboard');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Cadastro Realizado!</CardTitle>
            <CardDescription>
              Sua empresa foi cadastrada com sucesso no Smart Biz360
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {credentials && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Guarde suas credenciais de acesso:</strong>
                  <div className="mt-2 p-3 bg-white rounded border font-mono text-sm">
                    <div>Usuário: <strong>{credentials.username}</strong></div>
                    <div>Senha: <strong>{credentials.password}</strong></div>
                  </div>
                  <p className="mt-2 text-xs">Esta senha não será exibida novamente!</p>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-center text-sm text-gray-600">
              <p>Você tem <strong>14 dias de trial gratuito</strong> para explorar todas as funcionalidades.</p>
            </div>

            <Button onClick={goToDashboard} className="w-full" size="lg">
              Acessar o Sistema
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">Cadastre sua Empresa</CardTitle>
          <CardDescription>
            Comece a usar o Smart Biz360 em poucos minutos
          </CardDescription>
          
          {/* Progress Steps */}
          <div className="flex justify-center mt-6 space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s === step ? 'bg-indigo-600' : s < step ? 'bg-indigo-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: CNPJ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="font-semibold text-lg">Passo 1: Informe o CNPJ</h3>
                <p className="text-sm text-gray-500">O cadastro é feito exclusivamente via CNPJ</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ da Empresa</Label>
                <div className="relative">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => {
                      const formatted = formatCNPJ(e.target.value);
                      setCnpj(formatted);
                      if (formatted.replace(/\D/g, '').length === 14) {
                        validateCNPJ(formatted);
                      } else {
                        setCnpjValid(null);
                      }
                    }}
                    className={`pr-10 ${
                      cnpjValid === true ? 'border-green-500' : 
                      cnpjValid === false ? 'border-red-500' : ''
                    }`}
                  />
                  {cnpjValidating && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {cnpjValid === true && (
                    <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                  {cnpjValid === false && (
                    <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                  )}
                </div>
                {cnpjValid === true && (
                  <p className="text-sm text-green-600">CNPJ válido e disponível para cadastro</p>
                )}
              </div>

              <Button 
                onClick={nextStep} 
                disabled={!cnpjValid}
                className="w-full"
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Plano */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="font-semibold text-lg">Passo 2: Escolha seu Plano</h3>
                <p className="text-sm text-gray-500">Comece com 14 dias grátis em qualquer plano</p>
              </div>

              <div className="grid gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    onClick={() => setFormData({ ...formData, plano: plan.name })}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.plano === plan.name 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${plan.recommended ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{plan.displayName}</h4>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        {plan.priceMonthly > 0 ? (
                          <>
                            <span className="text-2xl font-bold">R$ {plan.priceMonthly}</span>
                            <span className="text-sm text-gray-500">/mês</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-green-600">Grátis</span>
                        )}
                      </div>
                    </div>
                    {plan.recommended && (
                      <span className="inline-block mt-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded">
                        Recomendado
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Dados da Empresa */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="font-semibold text-lg">Passo 3: Dados da Empresa</h3>
                <p className="text-sm text-gray-500">Preencha as informações da sua empresa</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa}
                    onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
                    placeholder="Razão Social ou Nome Fantasia"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="admin_email">Email do Administrador *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    placeholder="admin@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_name">Nome do Administrador</Label>
                  <Input
                    id="admin_name"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_password">Senha (opcional)</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    placeholder="Deixe vazio para gerar automaticamente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_password_confirm">Confirmar Senha</Label>
                  <Input
                    id="admin_password_confirm"
                    type="password"
                    value={formData.admin_password_confirm}
                    onChange={(e) => setFormData({ ...formData, admin_password_confirm: e.target.value })}
                    placeholder="Confirme a senha"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmação */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="font-semibold text-lg">Passo 4: Confirmar Cadastro</h3>
                <p className="text-sm text-gray-500">Revise os dados antes de finalizar</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">CNPJ:</span>
                  <span className="font-medium">{cnpj}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Empresa:</span>
                  <span className="font-medium">{formData.nome_empresa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{formData.admin_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plano:</span>
                  <span className="font-medium capitalize">{formData.plano}</span>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  Ao clicar em "Finalizar Cadastro", você concorda com nossos Termos de Uso e Política de Privacidade.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      Finalizar Cadastro
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Link para login */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Já tem uma conta?{' '}
            <a href="/login" className="text-indigo-600 hover:underline">
              Fazer login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
