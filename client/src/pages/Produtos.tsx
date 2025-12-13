import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Search, TrendingUp, AlertTriangle, CheckCircle, Edit, Eye, Plus, Trash2, Upload, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { REAL_CATEGORIES } from "@/data/real-data";
import { toast } from "sonner";

// Categorias reais do Markthub CRM
const categorias = REAL_CATEGORIES.map(cat => cat.name);

interface Produto {
  id: number;
  sku: string;
  name: string;
  category: string;
  sale_price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock?: number;
  images?: string[];
  description?: string;
  is_active: boolean;
  profit?: number;
  profit_margin?: number;
  created_at?: string;
  updated_at?: string;
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  
  // Modals
  const [modalVer, setModalVer] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  
  // Form
  const [formData, setFormData] = useState<Partial<Produto>>({
    name: '',
    sku: '',
    category: categorias[0],
    sale_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock: 5,
    description: '',
    is_active: true,
  });

  // Carregar produtos da API
  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('markethub_token');
      const response = await fetch('/api/produtos?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', response.status, errorData);
        
        if (response.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else if (response.status === 403) {
          toast.error('Você não tem permissão para visualizar produtos');
        } else {
          toast.error(errorData.error || 'Erro ao carregar produtos');
        }
        setProdutos([]);
        return;
      }

      const data = await response.json();
      console.log('Produtos carregados:', data);
      setProdutos(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Adicionar produto
  const adicionarProduto = async () => {
    if (!formData.name || !formData.sku || !formData.sale_price) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('markethub_token');
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: formData.name,
          sku: formData.sku,
          categoria: formData.category,
          preco_venda: formData.sale_price,
          preco_custo: formData.cost_price || 0,
          estoque_atual: formData.stock_quantity || 0,
          estoque_minimo: formData.min_stock || 5,
          descricao: formData.description,
          status: formData.is_active ? 'ativo' : 'inativo',
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar produto');
      }

      toast.success('Produto adicionado com sucesso!');
      setModalAdicionar(false);
      carregarProdutos();
      resetForm();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto');
    }
  };

  // Editar produto
  const editarProduto = async () => {
    if (!produtoSelecionado) return;

    try {
      const token = localStorage.getItem('markethub_token');
      const response = await fetch(`/api/produtos/${produtoSelecionado.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: formData.name,
          sku: formData.sku,
          categoria: formData.category,
          preco_venda: formData.sale_price,
          preco_custo: formData.cost_price,
          estoque_atual: formData.stock_quantity,
          estoque_minimo: formData.min_stock,
          descricao: formData.description,
          status: formData.is_active ? 'ativo' : 'inativo',
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao editar produto');
      }

      toast.success('Produto atualizado com sucesso!');
      setModalEditar(false);
      carregarProdutos();
      resetForm();
    } catch (error) {
      console.error('Erro ao editar produto:', error);
      toast.error('Erro ao editar produto');
    }
  };

  // Deletar produto
  const deletarProduto = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;

    try {
      const token = localStorage.getItem('markethub_token');
      const response = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar produto');
      }

      toast.success('Produto deletado com sucesso!');
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast.error('Erro ao deletar produto');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: categorias[0],
      sale_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      min_stock: 5,
      description: '',
      is_active: true,
    });
    setProdutoSelecionado(null);
  };

  const abrirModalVer = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setModalVer(true);
  };

  const abrirModalEditar = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setFormData({
      name: produto.name,
      sku: produto.sku,
      category: produto.category,
      sale_price: produto.sale_price,
      cost_price: produto.cost_price || 0,
      stock_quantity: produto.stock_quantity,
      min_stock: produto.min_stock || 5,
      description: produto.description || '',
      is_active: produto.is_active,
    });
    setModalEditar(true);
  };

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    const matchBusca = 
      produto.name?.toLowerCase().includes(busca.toLowerCase()) ||
      produto.sku?.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = filtroCategoria === 'todas' || produto.category === filtroCategoria;
    
    const matchStatus = 
      filtroStatus === 'todos' ||
      (filtroStatus === 'ativo' && produto.is_active) ||
      (filtroStatus === 'inativo' && !produto.is_active) ||
      (filtroStatus === 'estoque_baixo' && produto.stock_quantity <= (produto.min_stock || 5)) ||
      (filtroStatus === 'sem_estoque' && produto.stock_quantity === 0);
    
    return matchBusca && matchCategoria && matchStatus;
  });

  // Estatísticas
  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter(p => p.is_active).length;
  const produtosEstoqueBaixo = produtos.filter(p => p.stock_quantity <= (p.min_stock || 5)).length;
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + (p.sale_price * p.stock_quantity), 0);

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              Produtos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu catálogo de produtos
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={carregarProdutos} 
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={() => setModalAdicionar(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold text-foreground">{totalProdutos}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtos Ativos</p>
                <p className="text-2xl font-bold text-green-600">{produtosAtivos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold text-orange-600">{produtosEstoqueBaixo}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                <p className="text-2xl font-bold text-primary">
                  {valorTotalEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="todas">Todas as Categorias</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
              <option value="estoque_baixo">Estoque Baixo</option>
              <option value="sem_estoque">Sem Estoque</option>
            </select>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground">Carregando produtos...</p>
              </div>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {produtos.length === 0 
                  ? 'Adicione seu primeiro produto para começar'
                  : 'Tente ajustar os filtros de busca'}
              </p>
              {produtos.length === 0 && (
                <Button onClick={() => setModalAdicionar(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-foreground">SKU</th>
                    <th className="text-left p-4 font-semibold text-foreground">Produto</th>
                    <th className="text-left p-4 font-semibold text-foreground">Categoria</th>
                    <th className="text-right p-4 font-semibold text-foreground">Preço</th>
                    <th className="text-center p-4 font-semibold text-foreground">Estoque</th>
                    <th className="text-center p-4 font-semibold text-foreground">Status</th>
                    <th className="text-center p-4 font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((produto) => {
                    const estoqueStatus = produto.stock_quantity === 0 
                      ? 'sem-estoque' 
                      : produto.stock_quantity <= (produto.min_stock || 5) 
                      ? 'baixo' 
                      : 'ok';

                    return (
                      <tr key={produto.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-sm text-muted-foreground">{produto.sku}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-foreground">{produto.name}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{produto.category}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-foreground">
                            {produto.sale_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Badge 
                            variant={estoqueStatus === 'sem-estoque' ? 'destructive' : estoqueStatus === 'baixo' ? 'default' : 'secondary'}
                          >
                            {produto.stock_quantity} un
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={produto.is_active ? 'default' : 'secondary'}>
                            {produto.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => abrirModalVer(produto)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => abrirModalEditar(produto)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deletarProduto(produto.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Ver Produto */}
        <Dialog open={modalVer} onOpenChange={setModalVer}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Produto</DialogTitle>
              <DialogDescription>
                Informações completas do produto
              </DialogDescription>
            </DialogHeader>
            {produtoSelecionado && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">SKU</Label>
                    <p className="font-mono text-sm">{produtoSelecionado.sku}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nome</Label>
                    <p className="font-medium">{produtoSelecionado.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Categoria</Label>
                    <p>{produtoSelecionado.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Preço de Venda</Label>
                    <p className="font-semibold text-green-600">
                      {produtoSelecionado.sale_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Preço de Custo</Label>
                    <p>
                      {(produtoSelecionado.cost_price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Margem de Lucro</Label>
                    <p className="font-semibold text-blue-600">
                      {produtoSelecionado.profit_margin?.toFixed(2) || '0.00'}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estoque Atual</Label>
                    <p>{produtoSelecionado.stock_quantity} unidades</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estoque Mínimo</Label>
                    <p>{produtoSelecionado.min_stock || 5} unidades</p>
                  </div>
                </div>
                {produtoSelecionado.description && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p className="text-sm mt-1">{produtoSelecionado.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Adicionar Produto */}
        <Dialog open={modalAdicionar} onOpenChange={setModalAdicionar}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo produto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <Label>SKU *</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU-00001"
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Preço de Venda *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Preço de Custo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Estoque Inicial</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Estoque Mínimo</Label>
                  <Input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={formData.is_active ? 'ativo' : 'inativo'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'ativo' })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[100px]"
                  placeholder="Descrição do produto..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setModalAdicionar(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={adicionarProduto}>
                Adicionar Produto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Produto */}
        <Dialog open={modalEditar} onOpenChange={setModalEditar}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
              <DialogDescription>
                Atualize os dados do produto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <Label>SKU *</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU-00001"
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Preço de Venda *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Preço de Custo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Estoque Atual</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Estoque Mínimo</Label>
                  <Input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={formData.is_active ? 'ativo' : 'inativo'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'ativo' })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[100px]"
                  placeholder="Descrição do produto..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setModalEditar(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={editarProduto}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
