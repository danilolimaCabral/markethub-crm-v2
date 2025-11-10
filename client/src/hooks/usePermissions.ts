import { useState, useEffect } from 'react';

export interface UserPermissions {
  username: string;
  permissions: string[];
  role: string;
}

/**
 * Hook para verificar permissões do usuário logado
 */
export function usePermissions() {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = () => {
      try {
        // Obter usuário logado
        const userStr = localStorage.getItem('markethub_user');
        if (!userStr) {
          setUserPermissions([]);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const currentUser = JSON.parse(userStr);
        
        // Se for admin, tem acesso total
        if (currentUser.role === 'admin' || currentUser.username === 'admin') {
          setIsAdmin(true);
          setUserPermissions(['dashboard', 'chat', 'pedidos', 'produtos', 'anuncios', 'clientes', 'entregas', 'notas-fiscais', 'pos-vendas', 'importacao', 'inteligencia-mercado', 'tabela-preco', 'contas-pagar', 'contas-receber', 'fluxo-caixa', 'relatorios', 'vendas', 'metricas', 'mercado-livre', 'importacao-financeira', 'usuarios', 'configuracoes']);
          setLoading(false);
          return;
        }

        // Buscar permissões do usuário na lista de usuários
        const usersStr = localStorage.getItem('markethub_users');
        if (usersStr) {
          const users = JSON.parse(usersStr);
          const user = users.find((u: any) => u.username === currentUser.username);
          
          if (user && user.permissions) {
            setUserPermissions(user.permissions);
          } else {
            // Se não encontrar, dar permissões padrão
            setUserPermissions(['dashboard']);
          }
        } else {
          setUserPermissions(['dashboard']);
        }

        setIsAdmin(false);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        setUserPermissions([]);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkPermissions();

    // Verificar mudanças no localStorage
    const interval = setInterval(checkPermissions, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Verifica se o usuário tem permissão para acessar um módulo
   */
  const hasPermission = (module: string): boolean => {
    if (isAdmin) return true;
    return userPermissions.includes(module);
  };

  /**
   * Verifica se o usuário tem permissão para acessar qualquer um dos módulos
   */
  const hasAnyPermission = (modules: string[]): boolean => {
    if (isAdmin) return true;
    return modules.some(module => userPermissions.includes(module));
  };

  /**
   * Verifica se o usuário tem todas as permissões especificadas
   */
  const hasAllPermissions = (modules: string[]): boolean => {
    if (isAdmin) return true;
    return modules.every(module => userPermissions.includes(module));
  };

  return {
    permissions: userPermissions,
    isAdmin,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}
