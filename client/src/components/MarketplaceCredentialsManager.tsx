/**
 * Gerenciador de Credenciais de Marketplace
 * Permite admin cadastrar e gerenciar credenciais OAuth para cada cliente
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Key,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface Credential {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
  };
  tenant: {
    id: number;
    name: string;
  };
  marketplace: string;
  client_id: string;
  is_active: boolean;
  config: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  nome: string;
}

const MARKETPLACES = [
  { value: 'mercado_livre', label: 'Mercado Livre' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'magazine_luiza', label: 'Magazine Luiza' },
  { value: 'americanas', label: 'Americanas' },
  { value: 'via_varejo', label: 'Via Varejo' },
];

export default function MarketplaceCredentialsManager() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    marketplace: '',
    client_id: '',
    client_secret: '',
    redirect_uri: '',
  });

  useEffect(() => {
    loadCredentials();
    loadUsers();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/admin/marketplace-credentials', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao carregar credenciais');

      const data = await response.json();
      setCredentials(data.credentials);
    } catch (error: any) {
      toast.error('Erro ao carregar credenciais');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/superadmin/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao carregar usuários');

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.marketplace || !formData.client_id || !formData.client_secret) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const config = formData.redirect_uri ? { redirect_uri: formData.redirect_uri } : {};

      const response = await fetch('/api/admin/marketplace-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: parseInt(formData.user_id),
          marketplace: formData.marketplace,
          client_id: formData.client_id,
          client_secret: formData.client_secret,
          config,
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar credenciais');

      toast.success('Credenciais cadastradas com sucesso!');
      setDialogOpen(false);
      resetForm();
      loadCredentials();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover estas credenciais?')) return;

    try {
      const response = await fetch(`/api/admin/marketplace-credentials/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao remover credenciais');

      toast.success('Credenciais removidas com sucesso!');
      loadCredentials();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      marketplace: '',
      client_id: '',
      client_secret: '',
      redirect_uri: '',
    });
    setEditingId(null);
  };

  const getMarketplaceName = (value: string) => {
    return MARKETPLACES.find(m => m.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Credenciais de Marketplace</h2>
          <p className="text-muted-foreground">
            Gerencie as credenciais OAuth dos clientes para cada marketplace
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Credencial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Credenciais de Marketplace</DialogTitle>
              <DialogDescription>
                Adicione as credenciais OAuth do marketplace para um cliente específico
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selecionar Cliente */}
              <div className="space-y-2">
                <Label htmlFor="user_id">Cliente *</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.nome || user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selecionar Marketplace */}
              <div className="space-y-2">
                <Label htmlFor="marketplace">Marketplace *</Label>
                <Select
                  value={formData.marketplace}
                  onValueChange={(value) => setFormData({ ...formData, marketplace: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um marketplace" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACES.map((marketplace) => (
                      <SelectItem key={marketplace.value} value={marketplace.value}>
                        {marketplace.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client ID */}
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  placeholder="Ex: 6702284202610735"
                />
              </div>

              {/* Client Secret */}
              <div className="space-y-2">
                <Label htmlFor="client_secret">Client Secret *</Label>
                <div className="relative">
                  <Input
                    id="client_secret"
                    type={showSecret ? 'text' : 'password'}
                    value={formData.client_secret}
                    onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                    placeholder="Ex: co8Zb40AZvmMIvnhLk0vfRwuxPCESNac"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Redirect URI (opcional) */}
              <div className="space-y-2">
                <Label htmlFor="redirect_uri">Redirect URI (opcional)</Label>
                <Input
                  id="redirect_uri"
                  value={formData.redirect_uri}
                  onChange={(e) => setFormData({ ...formData, redirect_uri: e.target.value })}
                  placeholder="https://www.markthubcrm.com.br/api/integrations/..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Credenciais</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Credenciais</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credentials.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {credentials.filter(c => c.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {credentials.filter(c => !c.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Credenciais */}
      <Card>
        <CardHeader>
          <CardTitle>Credenciais Cadastradas</CardTitle>
          <CardDescription>
            Lista de todas as credenciais de marketplace cadastradas para os clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma credencial cadastrada ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credentials.map((credential) => (
                  <TableRow key={credential.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{credential.user.name}</div>
                        <div className="text-sm text-muted-foreground">{credential.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getMarketplaceName(credential.marketplace)}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {credential.client_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      {credential.is_active ? (
                        <Badge variant="default">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {credential.created_by || 'Sistema'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(credential.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
