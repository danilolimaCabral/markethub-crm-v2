import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredModule: string;
}

/**
 * Componente para proteger rotas baseado em permissões
 * Redireciona para /403 se o usuário não tiver permissão
 */
export default function ProtectedRoute({ children, requiredModule }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { hasPermission, loading, isAdmin } = usePermissions();

  useEffect(() => {
    // Aguardar carregamento das permissões
    if (loading) return;

    // Admin tem acesso a tudo
    if (isAdmin) return;

    // Verificar se tem permissão
    if (!hasPermission(requiredModule)) {
      console.warn(`Acesso negado ao módulo: ${requiredModule}`);
      setLocation('/403');
    }
  }, [hasPermission, requiredModule, loading, isAdmin, setLocation]);

  // Mostrar loading enquanto verifica permissões
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Admin ou usuário com permissão pode ver o conteúdo
  if (isAdmin || hasPermission(requiredModule)) {
    return <>{children}</>;
  }

  // Não renderizar nada enquanto redireciona
  return null;
}
