import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { 
  Plus, Edit, Eye, FileText, Calendar, DollarSign, 
  AlertTriangle, CheckCircle, Clock, RefreshCw
} from 'lucide-react';

import { toast } from 'sonner';

interface Contract {
  id: string;
  contract_number: string;
  instance_id: string;
  title: string;
  status: string;
  billing_rule: string;
  mrr_value: number;
  hourly_rate: number;
  hours_package: number;
  project_value: number;
  start_date: string;
  end_date: string;
  signed_at: string;
  instance_name: string;
  client_name: string;
  platform_name: string;
}

interface Instance {
  id: string;
  name: string;
  client_name: string;
  platform_name: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-500' },
  pending_approval: { label: 'Aguardando Aprovação', color: 'bg-yellow-500' },
  approved: { label: 'Aprovado', color: 'bg-blue-500' },
  active: { label: 'Ativo', color: 'bg-green-500' },
  suspended: { label: 'Suspenso', color: 'bg-orange-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
  expired: { label: 'Expirado', color: 'bg-gray-700' }
};

const billingRules: Record<string, string> = {
  mrr: 'Mensalidade (MRR)',
  hourly: 'Por Hora',
  hours_package: 'Pacote de Horas',
  fixed_project: 'Projeto Fixo'
};

export default function Contracts() {
  const token = localStorage.getItem('markethub_token');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    instance_id: '',
    title: '',
    billing_rule: 'mrr',
    mrr_value: 0,
    hourly_rate: 0,
    hours_package: 0,
    project_value: 0,
    start_date: '',
    end_date: '',
    terms: ''
  });

  useEffect(() => {
    fetchContracts();
    fetchInstances();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/control-tower/contracts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      toast.error('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/control-tower/instances', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInstances(data);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingContract 
        ? `/api/control-tower/contracts/${editingContract.id}`
        : '/api/control-tower/contracts';
      
      const response = await fetch(url, {
        method: editingContract ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingContract ? 'Contrato atualizado!' : 'Contrato criado!');
        setDialogOpen(false);
        resetForm();
        fetchContracts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar contrato');
      }
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      toast.error('Erro ao salvar contrato');
    }
  };

  const signContract = async (id: string) => {
    try {
      const response = await fetch(`/api/control-tower/contracts/${id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          signed_by_client: 'Cliente',
          signed_by_company: 'Empresa'
        })
      });

      if (response.ok) {
        toast.success('Contrato assinado!');
        fetchContracts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao assinar contrato');
      }
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
      toast.error('Erro ao assinar contrato');
    }
  };

  const resetForm = () => {
    setEditingContract(null);
    setFormData({
      instance_id: '',
      title: '',
      billing_rule: 'mrr',
      mrr_value: 0,
      hourly_rate: 0,
      hours_package: 0,
      project_value: 0,
      start_date: '',
      end_date: '',
      terms: ''
    });
  };

  const openEditDialog = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      instance_id: contract.instance_id,
      title: contract.title,
      billing_rule: contract.billing_rule,
      mrr_value: contract.mrr_value,
      hourly_rate: contract.hourly_rate,
      hours_package: contract.hours_package,
      project_value: contract.project_value,
      start_date: contract.start_date?.split('T')[0] || '',
      end_date: contract.end_date?.split('T')[0] || '',
      terms: ''
    });
    setDialogOpen(true);
  };

  const filteredContracts = contracts.filter(c => 
    !filterStatus || c.status === filterStatus
  );

  const totalMRR = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + Number(c.mrr_value), 0);

  const isExpiringSoon = (endDate: string) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">Gerencie contratos e faturamento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingContract ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
                <DialogDescription>
                  {editingContract ? 'Atualize as informações do contrato' : 'Crie um novo contrato'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Instância *</Label>
                  <Select
                    value={formData.instance_id}
                    onValueChange={(value) => setFormData({ ...formData, instance_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.client_name} - {instance.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título do contrato"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Início *</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Término</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Regra de Cobrança *</Label>
                  <Select
                    value={formData.billing_rule}
                    onValueChange={(value) => setFormData({ ...formData, billing_rule: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(billingRules).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.billing_rule === 'mrr' && (
                  <div className="space-y-2">
                    <Label>Valor MRR (R$)</Label>
                    <Input
                      type="number"
                      value={formData.mrr_value}
                      onChange={(e) => setFormData({ ...formData, mrr_value: parseFloat(e.target.value) })}
                      min={0}
                      step={0.01}
                    />
                  </div>
                )}
                {formData.billing_rule === 'hourly' && (
                  <div className="space-y-2">
                    <Label>Valor por Hora (R$)</Label>
                    <Input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                      min={0}
                      step={0.01}
                    />
                  </div>
                )}
                {formData.billing_rule === 'hours_package' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor do Pacote (R$)</Label>
                      <Input
                        type="number"
                        value={formData.mrr_value}
                        onChange={(e) => setFormData({ ...formData, mrr_value: parseFloat(e.target.value) })}
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horas Incluídas</Label>
                      <Input
                        type="number"
                        value={formData.hours_package}
                        onChange={(e) => setFormData({ ...formData, hours_package: parseInt(e.target.value) })}
                        min={0}
                      />
                    </div>
                  </div>
                )}
                {formData.billing_rule === 'fixed_project' && (
                  <div className="space-y-2">
                    <Label>Valor do Projeto (R$)</Label>
                    <Input
                      type="number"
                      value={formData.project_value}
                      onChange={(e) => setFormData({ ...formData, project_value: parseFloat(e.target.value) })}
                      min={0}
                      step={0.01}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Termos e Condições</Label>
                  <Textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    placeholder="Termos e condições do contrato..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingContract ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expirando em 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {contracts.filter(c => isExpiringSoon(c.end_date)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">
              {contracts.filter(c => c.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Contratos */}
      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum contrato encontrado</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro contrato</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Cliente / Instância</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <div>
                      <p className="font-mono text-sm">{contract.contract_number}</p>
                      <p className="font-medium">{contract.title}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contract.client_name}</p>
                      <p className="text-sm text-muted-foreground">{contract.instance_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{billingRules[contract.billing_rule]}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      R$ {Number(contract.mrr_value || contract.hourly_rate || contract.project_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {contract.billing_rule === 'hourly' && <span className="text-sm text-muted-foreground">/hora</span>}
                    {contract.billing_rule === 'hours_package' && <span className="text-sm text-muted-foreground"> ({contract.hours_package}h)</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isExpiringSoon(contract.end_date) && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <div>
                        <p className="text-sm">{new Date(contract.start_date).toLocaleDateString('pt-BR')}</p>
                        {contract.end_date && (
                          <p className="text-sm text-muted-foreground">até {new Date(contract.end_date).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[contract.status]?.color + ' text-white'}>
                      {statusConfig[contract.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {contract.status === 'draft' && (
                        <Button variant="ghost" size="sm" onClick={() => signContract(contract.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Assinar
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(contract)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
