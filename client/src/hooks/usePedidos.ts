import { useState, useEffect } from 'react';
import { getPedidos, Pedido } from '@/lib/api-client';

export function usePedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPedidos() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPedidos({ limit: 100 });
        setPedidos(data);
      } catch (err: any) {
        console.error('Erro ao buscar pedidos:', err);
        setError(err.message || 'Erro ao buscar pedidos');
        // Fallback para dados mockados em caso de erro
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPedidos();
  }, []);

  return { pedidos, loading, error };
}
