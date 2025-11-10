import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CRMLayout from "@/components/CRMLayout";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight, Calculator } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

interface DashboardMetrics {
  totalProdutos: number;
  valorEstoque: number;
  produtosBaixoEstoque: number;
  totalUsuarios: number;
  usuariosAtivos: number;
  ultimaAtualizacao: string;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProdutos: 0,
    valorEstoque: 0,
    produtosBaixoEstoque: 0,
    totalUsuarios: 0,
    usuariosAtivos: 0,
    ultimaAtualizacao: new Date().toLocaleString('pt-BR')
  });
  const [loading, setLoading] = useState(false);

  const loadMetrics = () => {
    setLoading(true);
    
    try {
      // Carregar produtos
      const produtosStr = localStorage.getItem('markethub_produtos');
      const produtos = produtosStr ? JSON.parse(produtosStr) : [];
      
      const totalProdutos = produtos.length;
      const valorEstoque = produtos.reduce((sum: number, p: any) => sum + (p.preco * p.estoque), 0);
      const produtosBaixoEstoque = produtos.filter((p: any) => p.estoque < 10).length;
      
      // Carregar usuários
      const usuariosStr = localStorage.getItem('markethub_users');
      const usuarios = usuariosStr ? JSON.parse(usuariosStr) : [];
      
      const totalUsuarios = usuarios.length;
      const usuariosAtivos = usuarios.filter((u: any) => u.active).length;
      
      setMetrics({
        totalProdutos,
        valorEstoque,
        produtosBaixoEstoque,
        totalUsuarios,
        usuariosAtivos,
        ultimaAtualizacao: new Date().toLocaleString('pt-BR')
      });
      
      toast.success('Métricas atualizadas!');
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <div className="flex gap-2">
            <Link href="/calculadora-taxas-ml">
              <Button variant="default" className="bg-amber-600 hover:bg-amber-700">
                <Calculator className="w-4 h-4 mr-2" />
                Calculadora Taxas ML
              </Button>
            </Link>
            <Button onClick={loadMetrics} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalProdutos}</div>
              <p className="text-xs text-muted-foreground">
                Produtos cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Valor em Estoque
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.valorEstoque)}</div>
              <p className="text-xs text-muted-foreground">
                Valor total dos produtos em estoque
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estoque Baixo
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{metrics.produtosBaixoEstoque}</div>
              <p className="text-xs text-muted-foreground">
                Produtos com menos de 10 unidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.usuariosAtivos}</div>
              <p className="text-xs text-muted-foreground">
                De {metrics.totalUsuarios} usuários cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Informações Adicionais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Vendas do Mês</CardTitle>
              <CardDescription>Comparado ao mês anterior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+0%</span> em relação ao mês passado
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Aguardando integração com marketplaces
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Pendentes</CardTitle>
              <CardDescription>Aguardando processamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Nenhum pedido pendente no momento
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Aguardando integração com marketplaces
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Última Atualização</CardTitle>
              <CardDescription>Sincronização de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{metrics.ultimaAtualizacao}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Dados atualizados do localStorage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas e Avisos */}
        {metrics.produtosBaixoEstoque > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Atenção: Produtos com Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Você tem <strong>{metrics.produtosBaixoEstoque} produto(s)</strong> com menos de 10 unidades em estoque.
                Considere reabastecer para evitar rupturas.
              </p>
              <Button variant="outline" className="mt-4" size="sm">
                Ver Produtos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </CRMLayout>
  );
}
