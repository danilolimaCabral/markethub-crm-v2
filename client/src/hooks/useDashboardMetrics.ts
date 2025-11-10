import { useState, useEffect } from 'react';
import { getDashboardMetrics, DashboardMetrics } from '@/lib/api-client';

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (err: any) {
        console.error('Erro ao buscar métricas:', err);
        setError(err.message || 'Erro ao buscar métricas');
        // Fallback para dados mockados
        setMetrics({
          totalPedidos: 0,
          totalFaturamento: 0,
          ticketMedio: 0,
          pedidosPendentes: 0,
          produtosAtivos: 0,
          anunciosAtivos: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return { metrics, loading, error };
}
