import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <ShieldX className="w-24 h-24 mx-auto text-red-500 mb-4" />
          <h1 className="text-6xl font-bold text-red-600 dark:text-red-400 mb-2">403</h1>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
            Acesso Negado
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Você não tem permissão para acessar esta página. Entre em contato com o administrador 
            do sistema para solicitar acesso.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button 
            onClick={() => setLocation('/')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Ir para Dashboard
          </Button>
        </div>

        <div className="mt-8 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>💡 Dica:</strong> Se você acredita que deveria ter acesso a esta página, 
            verifique suas permissões na seção de Configurações ou entre em contato com o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
