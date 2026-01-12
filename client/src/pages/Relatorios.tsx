import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  Filter,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Relatorio {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  icon: React.ReactNode;
  disponivel: boolean;
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('30');
  const [categoria, setCategoria] = useState('todos');

  const relatorios: Relatorio[] = [
    {
      id: 'vendas-periodo',
      nome: 'Relatório de Vendas por Período',
      descricao: 'Análise detalhada das vendas em um período específico',
      categoria: 'vendas',
      icon: <TrendingUp className="h-5 w-5" />,
      disponivel: true
    },
    {
      id: 'produtos-mais-vendidos',
      nome: 'Produtos Mais Vendidos',
      descricao: 'Ranking dos produtos com maior volume de vendas',
      categoria: 'produtos',
      icon: <Package className="h-5 w-5" />,
      disponivel: true
    },
    {
      id: 'faturamento-mensal',
      nome: 'Faturamento Mensal',
      descricao: 'Evolução do faturamento mês a mês',
      categoria: 'financeiro',
      icon: <DollarSign className="h-5 w-5" />,
      disponivel: true
    },
    {
      id: 'pedidos-status',
      nome: 'Pedidos por Status',
      descricao: 'Distribuição de pedidos por status de entrega',
      categoria: 'pedidos',
      icon: <ShoppingCart className="h-5 w-5" />,
      disponivel: true
    },
    {
      id: 'clientes-ativos',
      nome: 'Clientes Ativos',
      descricao: 'Lista de clientes com compras recentes',
      categoria: 'clientes',
      icon: <Users className="h-5 w-5" />,
      disponivel: true
    },
    {
      id: 'estoque-baixo',
      nome: 'Produtos com Estoque Baixo',
      descricao: 'Alerta de produtos que precisam reposição',
      categoria: 'produtos',
      icon: <Package className="h-5 w-5" />,
      disponivel: true
    },
    {
      id: 'performance-marketplace',
      nome: 'Performance por Marketplace',
      descricao: 'Comparativo de vendas entre marketplaces',
      categoria: 'vendas',
      icon: <BarChart3 className="h-5 w-5" />,
      disponivel: true
    },
    {
      id: 'comissoes',
      nome: 'Relatório de Comissões',
      descricao: 'Cálculo de comissões de vendedores',
      categoria: 'financeiro',
      icon: <DollarSign className="h-5 w-5" />,
      disponivel: false
    },
    {
      id: 'devolucoes',
      nome: 'Análise de Devoluções',
      descricao: 'Produtos com maior taxa de devolução',
      categoria: 'pedidos',
      icon: <ShoppingCart className="h-5 w-5" />,
      disponivel: false
    },
    {
      id: 'fiscal',
      nome: 'Relatório Fiscal',
      descricao: 'Dados para apuração fiscal e contábil',
      categoria: 'financeiro',
      icon: <FileText className="h-5 w-5" />,
      disponivel: false
    }
  ];

  const categorias = [
    { value: 'todos', label: 'Todas as Categorias' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'produtos', label: 'Produtos' },
    { value: 'pedidos', label: 'Pedidos' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'clientes', label: 'Clientes' }
  ];

  const relatoriosFiltrados = categoria === 'todos'
    ? relatorios
    : relatorios.filter(r => r.categoria === categoria);

  const handleGerarRelatorio = (relatorio: Relatorio) => {
    if (!relatorio.disponivel) {
      toast.info('Este relatório estará disponível em breve');
      return;
    }
    
    toast.success(`Gerando relatório: ${relatorio.nome}`);
    // Aqui você implementaria a lógica real de geração do relatório
  };

  const handleVisualizarRelatorio = (relatorio: Relatorio) => {
    if (!relatorio.disponivel) {
      toast.info('Este relatório estará disponível em breve');
      return;
    }
    
    toast.info(`Visualizando: ${relatorio.nome}`);
    // Aqui você implementaria a lógica de visualização
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere relatórios detalhados sobre seu negócio
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                  <SelectItem value="custom">Período personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Disponíveis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {relatorios.filter(r => r.disponivel).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {relatorios.length} totais
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período Selecionado</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periodo} dias</div>
            <p className="text-xs text-muted-foreground">
              para análise
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoria Ativa</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categorias.find(c => c.value === categoria)?.label}
            </div>
            <p className="text-xs text-muted-foreground">
              {relatoriosFiltrados.length} relatório(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Desenvolvimento</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {relatorios.filter(r => !r.disponivel).length}
            </div>
            <p className="text-xs text-muted-foreground">
              em breve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Relatórios */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {relatoriosFiltrados.map((relatorio) => (
          <Card key={relatorio.id} className="relative">
            {!relatorio.disponivel && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary">Em breve</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${relatorio.disponivel ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {relatorio.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{relatorio.nome}</CardTitle>
                  <CardDescription className="mt-1">
                    {relatorio.descricao}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleVisualizarRelatorio(relatorio)}
                  disabled={!relatorio.disponivel}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleGerarRelatorio(relatorio)}
                  disabled={!relatorio.disponivel}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Gerar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {relatoriosFiltrados.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
            <p className="text-muted-foreground">
              Tente selecionar outra categoria
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Sobre os Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Os relatórios são gerados com base nos dados do período selecionado
          </p>
          <p>
            • Você pode exportar os relatórios em formato PDF ou Excel
          </p>
          <p>
            • Novos relatórios estão sendo desenvolvidos constantemente
          </p>
          <p>
            • Para relatórios personalizados, entre em contato com o suporte
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
