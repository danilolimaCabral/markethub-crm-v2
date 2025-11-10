/**
 * Hook React para gerenciar renovação automática de token
 */

import { useEffect } from 'react';
import { startTokenRefreshMonitoring, stopTokenRefreshMonitoring } from '../lib/tokenRefresh';
import { isAuthenticated } from '../lib/auth';

/**
 * Hook que inicia o monitoramento de renovação de token quando o usuário está autenticado
 */
export function useTokenRefresh() {
  useEffect(() => {
    // Verifica se o usuário está autenticado
    if (isAuthenticated()) {
      console.log('[useTokenRefresh] Usuário autenticado, iniciando monitoramento de token');
      startTokenRefreshMonitoring();
    }

    // Cleanup: para o monitoramento quando o componente é desmontado
    return () => {
      console.log('[useTokenRefresh] Componente desmontado, parando monitoramento');
      stopTokenRefreshMonitoring();
    };
  }, []); // Executa apenas uma vez na montagem do componente
}
