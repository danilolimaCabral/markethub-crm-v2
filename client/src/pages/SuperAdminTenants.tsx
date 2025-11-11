import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Package, ShoppingCart, Plus, Edit, Eye, Copy } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface Tenant {
  id: number;
  company_name: string;
  slug: string;
  cnpj: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  max_users: number;
  max_products: number;
  max_orders: number;
  user_count: number;
  product_count: number;
  order_count: number;
  created_at: string;
}

interface NewTenantCredentials {
  username: string;
  password: string;
  email: string;
}

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [newTenantCredentials, setNewTenantCredentials] = useState<NewTenantCredentials | null>(null);
  
  const [formData, setFormData] = useState({
    nome_empresa: '',
    plano: 'starter'
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/tenants');
      setTenants(response.data);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
      toast.error('Erro ao carregar lista de clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/api/tenants', formData);
      
      if (response.data.success) {
        toast.success('Cliente criado com sucesso!');
        setNewTenantCredentials(response.data.admin_credentials);
        setShowCredentials(true);
        setIsDialogOpen(false);
        loadTenants();
        
        setFormData({
          nome_empresa: '',
          plano: 'starter'
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar tenant:', error);
      toast.error(error.response?.data?.error || 'Erro ao criar cliente');
    }
  };

  const handleCopyCredentials = () => {
    if (newTenantCredentials) {
      const text = `
Credenciais de Acesso - Markthub CRM

Usuário: ${newTenantCredentials.username}
Senha: ${newTenantCredentials.password}
Email: ${newTenantCredentials.email}

Acesse: https://www.markthubcrm.com.br/login

IMPORTANTE: Guarde esta senha em local seguro. Por segurança, ela não será exibida novamente.
      `.trim();
      
      navigator.clipboard.writeText(text);
      toast.success('Credenciais copiadas!');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      suspended: "destructive"
    };
    
    const labels: Record<string, string> = {
      active: "Ativo",
      trial: "Trial",
      suspended: "Suspenso"
    };
    
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const labels: Record<string, string> = {
      basic: "Básico",
      pro: "Pro",
      enterprise: "Enterprise"
    };
    
    return <Badge variant="outline">{labels[plan] || plan}</Badge>;
  };

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trial: tenants.filter(t => t.status === 'trial').length,
    suspended: tenants.filter(t => t.status === 'suspended').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Clientes</h1>
          <p className="text-muted-foreground">Gerencie todos os tenants do sistema</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
              <DialogDescription>Preencha os dados do cliente</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                  <Input 
                    id="nome_empresa" 
                    value={formData.nome_empresa} 
                    onChange={(e) => setFormData({...formData, nome_empresa: e.target.value})} 
                    placeholder="Digite o nome da empresa"
                    required 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Após criar o cliente, você poderá adicionar CNPJ, email, telefone e outras informações no módulo de integração.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="plano">Plano</Label>
                  <Select value={formData.plano} onValueChange={(value) => setFormData({...formData, plano: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter (3 usuários, 100 produtos)</SelectItem>
                      <SelectItem value="professional">Professional (10 usuários, 1000 produtos)</SelectItem>
                      <SelectItem value="business">Business (25 usuários, 2000 produtos)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (Ilimitado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Criar Cliente</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats.active}</div></CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trial</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{stats.trial}</div></CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspensos</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{stats.suspended}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{tenant.company_name}</CardTitle>
                </div>
                {getStatusBadge(tenant.status)}
              </div>
              <CardDescription>{getPlanBadge(tenant.plan)} • {tenant.slug}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CNPJ:</span>
                  <span className="font-medium">{tenant.cnpj}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium truncate ml-2">{tenant.email}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center">
                  <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xs font-medium">{tenant.user_count || 0}/{tenant.max_users === -1 ? '∞' : tenant.max_users}</div>
                  <div className="text-xs text-muted-foreground">Usuários</div>
                </div>
                <div className="text-center">
                  <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xs font-medium">{tenant.product_count || 0}/{tenant.max_products === -1 ? '∞' : tenant.max_products}</div>
                  <div className="text-xs text-muted-foreground">Produtos</div>
                </div>
                <div className="text-center">
                  <ShoppingCart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-xs font-medium">{tenant.order_count || 0}/{tenant.max_orders === -1 ? '∞' : tenant.max_orders}</div>
                  <div className="text-xs text-muted-foreground">Pedidos</div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1"><Eye className="h-4 w-4 mr-1" />Ver</Button>
                <Button variant="outline" size="sm" className="flex-1"><Edit className="h-4 w-4 mr-1" />Editar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cliente Criado com Sucesso!</DialogTitle>
            <DialogDescription>Guarde estas credenciais em local seguro.</DialogDescription>
          </DialogHeader>
          
          {newTenantCredentials && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Usuário</Label>
                  <p className="font-mono font-bold">{newTenantCredentials.username}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Senha</Label>
                  <p className="font-mono font-bold">{newTenantCredentials.password}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-mono">{newTenantCredentials.email}</p>
                </div>
              </div>
              
              <Button onClick={handleCopyCredentials} className="w-full">
                <Copy className="h-4 w-4 mr-2" />Copiar Credenciais
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
