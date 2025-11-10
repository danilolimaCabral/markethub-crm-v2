import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { Brain, Lock, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    
    // Simular delay de autenticação
    setTimeout(() => {
      // Validar credenciais (admin/admin123)
      if (username === 'admin' && password === 'admin123') {
        const user = {
          username: 'admin',
          name: 'Administrador',
          role: 'admin'
        };

        // Verificar se 2FA está habilitado
        const users = JSON.parse(localStorage.getItem('markethub_users') || '[]');
        const existingUser = users.find((u: any) => u.username === username);
        
        if (existingUser && existingUser.twoFactorEnabled) {
          // Salvar dados temporários para verificação 2FA
          sessionStorage.setItem('temp_login_user', JSON.stringify(user));
          toast.info('Digite o código de verificação');
          setLocation('/verify-2fa');
        } else {
          // Login direto sem 2FA
          localStorage.setItem('markethub_user', JSON.stringify(user));
          toast.success('Login realizado com sucesso!');
          setLocation('/');
        }
      } else {
        toast.error('Usuário ou senha incorretos');
      }
      
      setIsLoading(false);
    }, 800);
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recoveryEmail) {
      toast.error('Digite seu email');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) {
      toast.error('Email inválido');
      return;
    }

    setIsRecoveryLoading(true);
    
    // Simular envio de email
    setTimeout(() => {
      toast.success('Código de recuperação enviado para seu email!');
      setIsRecoveryOpen(false);
      setRecoveryEmail('');
      setIsRecoveryLoading(false);
    }, 1500);
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        toast.error('Erro ao fazer login com Google');
        return;
      }

      // Decodificar JWT do Google
      const decoded: any = jwtDecode(credentialResponse.credential);
      
      const user = {
        username: decoded.email,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        role: 'user',
        loginMethod: 'google'
      };

      // Salvar usuário no localStorage
      localStorage.setItem('markethub_user', JSON.stringify(user));
      
      toast.success(`Bem-vindo, ${decoded.name}!`);
      setLocation('/');
    } catch (error) {
      console.error('Erro ao processar login do Google:', error);
      toast.error('Erro ao fazer login com Google');
    }
  };

  const handleGoogleError = () => {
    toast.error('Falha no login com Google');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-700/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/50 overflow-hidden p-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-75"></div>
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MarketHub CRM
          </h1>
          <p className="text-center text-slate-400 text-sm mb-8">
            Entre com suas credenciais
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-slate-300 text-sm font-medium">
                Usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="seu_usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-purple-500 transition-all h-12 rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-slate-300 text-sm font-medium">
                  Senha
                </label>
                <Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Recuperar Senha</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Digite seu email para receber o código de recuperação
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordRecovery} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <label htmlFor="recovery-email" className="text-slate-300 text-sm font-medium">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <Input
                            id="recovery-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            className="pl-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-purple-500 transition-all h-12 rounded-xl"
                            disabled={isRecoveryLoading}
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={isRecoveryLoading}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all"
                      >
                        {isRecoveryLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Enviando...
                          </div>
                        ) : (
                          'Enviar Código'
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-purple-500 transition-all h-12 rounded-xl"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all mt-6"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Não tem uma conta?{' '}
            <button className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
              Cadastre-se
            </button>
          </p>


        </div>
      </div>
    </div>
  );
}
