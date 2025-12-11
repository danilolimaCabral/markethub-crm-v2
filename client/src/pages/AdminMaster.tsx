import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  plano: 'starter' | 'professional' | 'business' | 'enterprise';
  status: 'ativo' | 'inativo' | 'trial';
  dataCriacao: string;
  faturamentoMensal: number;
  pedidosMes: number;
  produtosAtivos: number;
}

export default function AdminMaster() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar clientes do backend
  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/clientes');
      const clientesFormatados = response.data.map((c: any) => ({
        id: c.id.toString(),
        nome: c.nome,
        empresa: c.empresa,
        email: c.email,
        telefone: c.telefone || '',
        plano: c.plano,
        status: c.status,
        dataCriacao: c.created_at.split('T')[0],
        faturamentoMensal: parseFloat(c.faturamento_total) || 0,
        pedidosMes: c.total_pedidos || 0,
        produtosAtivos: c.total_produtos || 0
      }));
      setClientes(clientesFormatados);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<{
    nome: string;
    empresa: string;
    email: string;
    telefone: string;
    plano: 'starter' | 'professional' | 'business' | 'enterprise';
    status: 'trial' | 'ativo' | 'inativo';
  }>({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    plano: 'starter',
    status: 'trial'
  });

  // Estatísticas gerais
  const stats = {
    totalClientes: clientes.length,
    clientesAtivos: clientes.filter(c => c.status === 'ativo').length,
    faturamentoTotal: clientes.reduce((acc, c) => acc + c.faturamentoMensal, 0),
    pedidosTotal: clientes.reduce((acc, c) => acc + c.pedidosMes, 0)
  };

  const handleAddCliente = async () => {
    if (!formData.nome || !formData.empresa || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await axios.post('/api/clientes', formData);
      await loadClientes();
      setIsDialogOpen(false);
      resetForm();
      toast.success('Cliente adicionado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error(error.response?.data?.error || 'Erro ao adicionar cliente');
    }
  };

  const handleEditCliente = async () => {
    if (!editingCliente) return;

    try {
      await axios.put(`/api/clientes/${editingCliente.id}`, formData);
      await loadClientes();
      setIsDialogOpen(false);
      setEditingCliente(null);
      resetForm();
      toast.success('Cliente atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar cliente');
    }
  };

  const handleDeleteCliente = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return;

    try {
      await axios.delete(`/api/clientes/${id}`);
      await loadClientes();
      toast.success('Cliente removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover cliente:', error);
      toast.error(error.response?.data?.error || 'Erro ao remover cliente');
    }
  };

  const openEditDialog = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      empresa: cliente.empresa,
      email: cliente.email,
      telefone: cliente.telefone,
      plano: cliente.plano,
      status: cliente.status
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      empresa: '',
      email: '',
      telefone: '',
      plano: 'starter',
      status: 'trial'
    });
    setEditingCliente(null);
  };

  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Cliente['status']) => {
    const variants = {
      ativo: { color: 'bg-green-500/10 text-green-700 border-green-200', icon: CheckCircle2 },
      inativo: { color: 'bg-red-500/10 text-red-700 border-red-200', icon: XCircle },
      trial: { color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200', icon: AlertCircle }
    };

    const { color, icon: Icon } = variants[status];

    return (
      <Badge variant="outline" className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPlanoBadge = (plano: Cliente['plano']) => {
    const colors = {
      starter: 'bg-blue-500/10 text-blue-700 border-blue-200',
      professional: 'bg-purple-500/10 text-purple-700 border-purple-200',
      business: 'bg-orange-500/10 text-orange-700 border-orange-200',
      enterprise: 'bg-pink-500/10 text-pink-700 border-pink-200'
    };

    return (
      <Badge variant="outline" className={colors[plano]}>
        {plano.charAt(0).toUpperCase() + plano.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-purple-600" />
            Painel Master
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento de clientes multi-tenant
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {editingCliente
                  ? 'Atualize as informações do cliente'
                  : 'Adicione um novo cliente ao sistema'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="empresa">Empresa *</Label>
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plano">Plano</Label>
                <Select
                  value={formData.plano}
                  onValueChange={(value: any) => setFormData({ ...formData, plano: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter - R$ 49/mês</SelectItem>
                    <SelectItem value="professional">Professional - R$ 99/mês</SelectItem>
                    <SelectItem value="business">Business - R$ 199/mês</SelectItem>
                    <SelectItem value="enterprise">Enterprise - R$ 399/mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial (14 dias)</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={editingCliente ? handleEditCliente : handleAddCliente}>
                {editingCliente ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.clientesAtivos} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats.faturamentoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensal combinado
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-purple-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Totais</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pedidosTotal}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-orange-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ativação</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.clientesAtivos / stats.totalClientes) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>
                Gerencie todos os clientes do sistema
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Métricas</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {cliente.empresa}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {cliente.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {cliente.telefone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPlanoBadge(cliente.plano)}</TableCell>
                  <TableCell>{getStatusBadge(cliente.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0
                        }).format(cliente.faturamentoMensal)}
                      </div>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                        {cliente.pedidosMes} pedidos
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3 text-muted-foreground" />
                        {cliente.produtosAtivos} produtos
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(cliente.dataCriacao).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(cliente)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCliente(cliente.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredClientes.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Tente ajustar os filtros de busca'
                  : 'Adicione seu primeiro cliente para começar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
