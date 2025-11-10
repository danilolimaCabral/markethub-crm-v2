import { useState, useEffect } from 'react';
import { getProdutos, Produto } from '@/lib/api-client';

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProdutos() {
      try {
        setLoading(true);
        setError(null);
        const data = await getProdutos({ limit: 100 });
        setProdutos(data);
      } catch (err: any) {
        console.error('Erro ao buscar produtos:', err);
        setError(err.message || 'Erro ao buscar produtos');
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProdutos();
  }, []);

  return { produtos, loading, error };
}
