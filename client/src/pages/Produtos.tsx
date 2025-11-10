import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Search, TrendingUp, AlertTriangle, CheckCircle, Edit, Eye, Plus, Trash2, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { REAL_CATEGORIES } from "@/data/real-data";
import { toast } from "sonner";

// Categorias reais do MarketHub CRM
const categorias = REAL_CATEGORIES.map(cat => cat.name);

interface Produto {
  id: number;
  sku: string;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  vendidos: number;
  imagem: string;
  descricao?: string;
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
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
    nome: '',
    sku: '',
    categoria: categorias[0],
    preco: 0,
    estoque: 0,
    vendidos: 0,
    imagem: '',
    descricao: '',
  });

  // Carregar produtos do localStorage
  useEffect(() => {
    const produtosSalvos = localStorage.getItem('markethub_produtos');
    if (produtosSalvos) {
      setProdutos(JSON.parse(produtosSalvos));
    } else {
      // Gerar produtos iniciais
      const produtosIniciais = Array.from({ length: 248 }, (_, i) => {
        const categoria = categorias[i % categorias.length];
        return {
          id: i + 1,
          sku: `SKU-${String(i + 1).padStart(5, '0')}`,
          nome: `${categoria} - Modelo ${i + 1}`,
          categoria: categoria,
          preco: Math.floor(Math.random() * 500) + 50,
          estoque: Math.floor(Math.random() * 100),
          vendidos: Math.floor(Math.random() * 50),
          imagem: `https://via.placeholder.com/300x300?text=${encodeURIComponent(categoria.substring(0, 10))}`,
          descricao: `Produto de alta qualidade da categoria ${categoria}`,
        };
      });
      setProdutos(produtosIniciais);
      localStorage.setItem('markethub_produtos', JSON.stringify(produtosIniciais));
    }
  }, []);

  // Salvar produtos no localStorage
  const salvarProdutos = (novosProdutos: Produto[]) => {
    setProdutos(novosProdutos);
    localStorage.setItem('markethub_produtos', JSON.stringify(novosProdutos));
  };

  // Adicionar produto
  const adicionarProduto = () => {
    if (!formData.nome || !formData.sku || !formData.preco) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const novoProduto: Produto = {
      id: Date.now(),
      nome: formData.nome!,
      sku: formData.sku!,
      categoria: formData.categoria!,
      preco: Number(formData.preco),
      estoque: Number(formData.estoque || 0),
      vendidos: Number(formData.vendidos || 0),
      imagem: formData.imagem || 'https://via.placeholder.com/300x300?text=Produto',
      descricao: formData.descricao || '',
    };

    salvarProdutos([...produtos, novoProduto]);
    setModalAdicionar(false);
    resetForm();
    toast.success('Produto adicionado com sucesso!');
  };

  // Editar produto
  const editarProduto = () => {
    if (!produtoSelecionado) return;

    const produtosAtualizados = produtos.map(p =>
      p.id === produtoSelecionado.id
        ? { ...p, ...formData }
        : p
    );

    salvarProdutos(produtosAtualizados);
    setModalEditar(false);
    setProdutoSelecionado(null);
    resetForm();
    toast.success('Produto atualizado com sucesso!');
  };

  // Excluir produto
  const excluirProduto = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      salvarProdutos(produtos.filter(p => p.id !== id));
      setModalVer(false);
      toast.success('Produto excluído com sucesso!');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      sku: '',
      categoria: categorias[0],
      preco: 0,
      estoque: 0,
      vendidos: 0,
      imagem: '',
      descricao: '',
    });
  };

  // Abrir modal de ver
  const abrirModalVer = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setModalVer(true);
  };

  // Abrir modal de editar
  const abrirModalEditar = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setFormData(produto);
    setModalEditar(true);
  };

  // Abrir modal de adicionar
  const abrirModalAdicionar = () => {
    resetForm();
    setModalAdicionar(true);
  };

  // Upload de imagem (simulado com URL)
  const handleImagemUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Em produção, fazer upload real para servidor/S3
      // Por enquanto, usar URL de placeholder
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imagem: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    const matchBusca = busca === '' || 
      produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      produto.sku.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = filtroCategoria === 'todas' || produto.categoria === filtroCategoria;
    
    const estoque = produto.estoque;
    const status = estoque > 10 ? 'Disponível' : estoque > 0 ? 'Estoque Baixo' : 'Sem Estoque';
    const matchStatus = filtroStatus === 'todos' || status === filtroStatus;
    
    return matchBusca && matchCategoria && matchStatus;
  });

  // Estatísticas
  const stats = {
    total: produtos.length,
    disponiveis: produtos.filter(p => p.estoque > 10).length,
    estoqueBaixo: produtos.filter(p => p.estoque > 0 && p.estoque <= 10).length,
    semEstoque: produtos.filter(p => p.estoque === 0).length,
    valorTotal: produtos.reduce((acc, p) => acc + (p.preco * p.estoque), 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gestão de catálogo de produtos</p>
        </div>
        <Button onClick={abrirModalAdicionar} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Produto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">{stats.disponiveis}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.estoqueBaixo}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sem Estoque</p>
                <p className="text-2xl font-bold text-red-600">{stats.semEstoque}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {(stats.valorTotal / 1000).toFixed(0)}k
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-background"
              >
                <option value="todas">Todas Categorias</option>
                {categorias.slice(0, 10).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Button
                variant={filtroStatus === 'todos' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('todos')}
              >
                Todos
              </Button>
              <Button
                variant={filtroStatus === 'Disponível' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('Disponível')}
              >
                Disponíveis
              </Button>
              <Button
                variant={filtroStatus === 'Estoque Baixo' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('Estoque Baixo')}
              >
                Estoque Baixo
              </Button>
              <Button
                variant={filtroStatus === 'Sem Estoque' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('Sem Estoque')}
              >
                Sem Estoque
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Produtos</CardTitle>
          <CardDescription>
            {produtosFiltrados.length} produto(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabela Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">SKU</th>
                  <th className="text-left p-3 font-semibold">Produto</th>
                  <th className="text-left p-3 font-semibold">Categoria</th>
                  <th className="text-left p-3 font-semibold">Preço</th>
                  <th className="text-left p-3 font-semibold">Estoque</th>
                  <th className="text-left p-3 font-semibold">Vendidos</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.slice(0, 50).map((produto) => {
                  const estoque = produto.estoque;
                  const status = estoque > 10 ? 'Disponível' : estoque > 0 ? 'Estoque Baixo' : 'Sem Estoque';
                  const statusColor = estoque > 10 ? 'bg-green-100 text-green-800' : estoque > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                  const StatusIcon = estoque > 10 ? CheckCircle : AlertTriangle;
                  
                  return (
                    <tr key={produto.id} className="border-b hover:bg-accent">
                      <td className="p-3 font-mono text-sm">{produto.sku}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={produto.imagem} 
                            alt={produto.nome}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <span className="font-medium">{produto.nome}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{produto.categoria}</td>
                      <td className="p-3 font-bold text-green-600">
                        R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${estoque > 10 ? 'text-green-600' : estoque > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {produto.estoque} un
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{produto.vendidos} un</td>
                      <td className="p-3">
                        <Badge className={statusColor}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => abrirModalVer(produto)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => abrirModalEditar(produto)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards Mobile */}
          <div className="md:hidden space-y-3">
            {produtosFiltrados.slice(0, 50).map((produto) => {
              const estoque = produto.estoque;
              const status = estoque > 10 ? 'Disponível' : estoque > 0 ? 'Estoque Baixo' : 'Sem Estoque';
              const statusColor = estoque > 10 ? 'bg-green-100 text-green-800' : estoque > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
              const StatusIcon = estoque > 10 ? CheckCircle : AlertTriangle;
              
              return (
                <Card key={produto.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-3 mb-3">
                      <img 
                        src={produto.imagem} 
                        alt={produto.nome}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-bold">{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">{produto.sku}</p>
                        <Badge className={`${statusColor} mt-1`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Categoria:</span> {produto.categoria}</p>
                      <p><span className="text-muted-foreground">Preço:</span> <span className="font-bold text-green-600">R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                      <p><span className="text-muted-foreground">Estoque:</span> <span className={`font-bold ${estoque > 10 ? 'text-green-600' : estoque > 0 ? 'text-yellow-600' : 'text-red-600'}`}>{produto.estoque} un</span></p>
                      <p><span className="text-muted-foreground">Vendidos:</span> {produto.vendidos} un</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => abrirModalVer(produto)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => abrirModalEditar(produto)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal Ver Produto */}
      <Dialog open={modalVer} onOpenChange={setModalVer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
            <DialogDescription>Informações completas do produto</DialogDescription>
          </DialogHeader>
          {produtoSelecionado && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img 
                  src={produtoSelecionado.imagem} 
                  alt={produtoSelecionado.nome}
                  className="w-32 h-32 rounded object-cover"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold">{produtoSelecionado.nome}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {produtoSelecionado.sku}</p>
                  <Badge>{produtoSelecionado.categoria}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preço</Label>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {produtoSelecionado.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <Label>Estoque</Label>
                  <p className="text-2xl font-bold">
                    {produtoSelecionado.estoque} unidades
                  </p>
                </div>
                <div>
                  <Label>Vendidos</Label>
                  <p className="text-xl">{produtoSelecionado.vendidos} unidades</p>
                </div>
                <div>
                  <Label>Valor Total em Estoque</Label>
                  <p className="text-xl font-bold text-primary">
                    R$ {(produtoSelecionado.preco * produtoSelecionado.estoque).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              {produtoSelecionado.descricao && (
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm text-muted-foreground">{produtoSelecionado.descricao}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => produtoSelecionado && excluirProduto(produtoSelecionado.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
            <Button variant="outline" onClick={() => setModalVer(false)}>Fechar</Button>
            <Button onClick={() => {
              if (produtoSelecionado) {
                setModalVer(false);
                abrirModalEditar(produtoSelecionado);
              }
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Produto */}
      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>Atualize as informações do produto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nome">Nome do Produto *</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Notebook Dell Inspiron"
                />
              </div>
              <div>
                <Label htmlFor="edit-sku">SKU *</Label>
                <Input
                  id="edit-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: SKU-00001"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-categoria">Categoria</Label>
              <select
                id="edit-categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-background"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-preco">Preço (R$) *</Label>
                <Input
                  id="edit-preco"
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-estoque">Estoque</Label>
                <Input
                  id="edit-estoque"
                  type="number"
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-vendidos">Vendidos</Label>
                <Input
                  id="edit-vendidos"
                  type="number"
                  value={formData.vendidos}
                  onChange={(e) => setFormData({ ...formData, vendidos: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-background min-h-[100px]"
                placeholder="Descrição detalhada do produto..."
              />
            </div>
            <div>
              <Label htmlFor="edit-imagem">Imagem do Produto</Label>
              <div className="flex gap-4 items-center">
                {formData.imagem && (
                  <img 
                    src={formData.imagem} 
                    alt="Preview"
                    className="w-24 h-24 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="edit-imagem"
                    type="file"
                    accept="image/*"
                    onChange={handleImagemUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ou cole uma URL de imagem:
                  </p>
                  <Input
                    value={formData.imagem}
                    onChange={(e) => setFormData({ ...formData, imagem: e.target.value })}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditar(false)}>Cancelar</Button>
            <Button onClick={editarProduto}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Produto */}
      <Dialog open={modalAdicionar} onOpenChange={setModalAdicionar}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>Cadastre um novo produto no catálogo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-nome">Nome do Produto *</Label>
                <Input
                  id="add-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Notebook Dell Inspiron"
                />
              </div>
              <div>
                <Label htmlFor="add-sku">SKU *</Label>
                <Input
                  id="add-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: SKU-00001"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="add-categoria">Categoria</Label>
              <select
                id="add-categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-background"
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="add-preco">Preço (R$) *</Label>
                <Input
                  id="add-preco"
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="add-estoque">Estoque</Label>
                <Input
                  id="add-estoque"
                  type="number"
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="add-vendidos">Vendidos</Label>
                <Input
                  id="add-vendidos"
                  type="number"
                  value={formData.vendidos}
                  onChange={(e) => setFormData({ ...formData, vendidos: parseInt(e.target.value) })}
                  placeholder="0"
                  disabled
                />
              </div>
            </div>
            <div>
              <Label htmlFor="add-descricao">Descrição</Label>
              <textarea
                id="add-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-background min-h-[100px]"
                placeholder="Descrição detalhada do produto..."
              />
            </div>
            <div>
              <Label htmlFor="add-imagem">Imagem do Produto</Label>
              <div className="flex gap-4 items-center">
                {formData.imagem && (
                  <img 
                    src={formData.imagem} 
                    alt="Preview"
                    className="w-24 h-24 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="add-imagem"
                    type="file"
                    accept="image/*"
                    onChange={handleImagemUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ou cole uma URL de imagem:
                  </p>
                  <Input
                    value={formData.imagem}
                    onChange={(e) => setFormData({ ...formData, imagem: e.target.value })}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAdicionar(false)}>Cancelar</Button>
            <Button onClick={adicionarProduto}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
