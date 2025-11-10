import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Package, Megaphone, Users, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

interface SearchResult {
  id: string;
  type: 'pedido' | 'produto' | 'anuncio' | 'cliente' | 'entrega';
  title: string;
  subtitle: string;
  url: string;
}

// Dados mockados para demonstração
const mockData: SearchResult[] = [
  { id: '1', type: 'pedido', title: 'Pedido #12345', subtitle: 'Cliente: João Silva - R$ 299,90', url: '/pedidos' },
  { id: '2', type: 'pedido', title: 'Pedido #12346', subtitle: 'Cliente: Maria Santos - R$ 450,00', url: '/pedidos' },
  { id: '3', type: 'produto', title: 'Notebook Dell Inspiron', subtitle: 'Estoque: 15 unidades', url: '/produtos' },
  { id: '4', type: 'produto', title: 'Mouse Logitech MX Master', subtitle: 'Estoque: 42 unidades', url: '/produtos' },
  { id: '5', type: 'anuncio', title: 'Anúncio Mercado Livre #789', subtitle: 'Ativo - 23 visualizações', url: '/anuncios' },
  { id: '6', type: 'cliente', title: 'João Silva', subtitle: 'joao@email.com - 12 pedidos', url: '/clientes' },
  { id: '7', type: 'cliente', title: 'Maria Santos', subtitle: 'maria@email.com - 8 pedidos', url: '/clientes' },
  { id: '8', type: 'entrega', title: 'Entrega #456', subtitle: 'Em trânsito - Previsão: 2 dias', url: '/entregas' },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'pedido': return <ShoppingCart className="w-4 h-4" />;
    case 'produto': return <Package className="w-4 h-4" />;
    case 'anuncio': return <Megaphone className="w-4 h-4" />;
    case 'cliente': return <Users className="w-4 h-4" />;
    case 'entrega': return <FileText className="w-4 h-4" />;
    default: return <Search className="w-4 h-4" />;
  }
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    pedido: 'Pedido',
    produto: 'Produto',
    anuncio: 'Anúncio',
    cliente: 'Cliente',
    entrega: 'Entrega',
  };
  return labels[type] || type;
};

export default function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    // Filtrar resultados baseado na query
    const filtered = mockData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setLocation(result.url);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pesquisa Global</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pedidos, produtos, clientes, anúncios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {query && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum resultado encontrado para "{query}"
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="mt-1 text-muted-foreground">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{result.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Dica: Use atalhos de teclado</p>
              <ul className="space-y-1 text-xs">
                <li>• <kbd className="px-2 py-1 bg-muted rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-muted rounded">K</kbd> - Abrir pesquisa</li>
                <li>• <kbd className="px-2 py-1 bg-muted rounded">Esc</kbd> - Fechar pesquisa</li>
                <li>• <kbd className="px-2 py-1 bg-muted rounded">↑</kbd> <kbd className="px-2 py-1 bg-muted rounded">↓</kbd> - Navegar resultados</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
