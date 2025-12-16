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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Edit, Eye, Clock, AlertTriangle, Bug, Lightbulb, 
  RefreshCw, Headphones, FolderKanban, Timer, Play, Pause
} from 'lucide-react';

import { toast } from 'sonner';

interface Demand {
  id: string;
  demand_number: string;
  instance_id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  estimated_hours: number;
  actual_hours: number;
  sla_deadline: string;
  instance_name: string;
  client_name: string;
  platform_name: string;
  assigned_to_name: string;
  created_at: string;
}

interface Instance {
  id: string;
  name: string;
  client_name: string;
  platform_name: string;
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  change: { label: 'Mudança', icon: RefreshCw, color: 'bg-blue-500' },
  bug: { label: 'Bug', icon: Bug, color: 'bg-red-500' },
  improvement: { label: 'Melhoria', icon: Lightbulb, color: 'bg-yellow-500' },
  support: { label: 'Suporte', icon: Headphones, color: 'bg-purple-500' },
  project: { label: 'Projeto', icon: FolderKanban, color: 'bg-green-500' }
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Crítica', color: 'bg-red-600 text-white' },
  high: { label: 'Alta', color: 'bg-orange-500 text-white' },
  medium: { label: 'Média', color: 'bg-yellow-500' },
  low: { label: 'Baixa', color: 'bg-green-500 text-white' }
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Aberto', color: 'bg-gray-500' },
  triaging: { label: 'Triagem', color: 'bg-purple-500' },
  planned: { label: 'Planejado', color: 'bg-blue-400' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-600' },
  review: { label: 'Revisão', color: 'bg-yellow-600' },
  testing: { label: 'Teste', color: 'bg-orange-500' },
  deployed: { label: 'Implantado', color: 'bg-green-500' },
  closed: { label: 'Fechado', color: 'bg-gray-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-700' }
};

export default function Demands() {
  const token = localStorage.getItem('markethub_token');
  const [demands, setDemands] = useState<Demand[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [formData, setFormData] = useState({
    instance_id: '',
    title: '',
    description: '',
    type: 'change',
    priority: 'medium',
    estimated_hours: 0
  });

  useEffect(() => {
    fetchDemands();
    fetchInstances();
  }, []);

  const fetchDemands = async () => {
    try {
      const response = await fetch('/api/control-tower/demands', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDemands(data);
      }
    } catch (error) {
      console.error('Erro ao carregar demandas:', error);
      toast.error('Erro ao carregar demandas');
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
      const url = editingDemand 
        ? `/api/control-tower/demands/${editingDemand.id}`
        : '/api/control-tower/demands';
      
      const response = await fetch(url, {
        method: editingDemand ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingDemand ? 'Demanda atualizada!' : 'Demanda criada!');
        setDialogOpen(false);
        resetForm();
        fetchDemands();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar demanda');
      }
    } catch (error) {
      console.error('Erro ao salvar demanda:', error);
      toast.error('Erro ao salvar demanda');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/control-tower/demands/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success('Status atualizado!');
        fetchDemands();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const resetForm = () => {
    setEditingDemand(null);
    setFormData({
      instance_id: '',
      title: '',
      description: '',
      type: 'change',
      priority: 'medium',
      estimated_hours: 0
    });
  };

  const filteredDemands = demands.filter(demand => {
    const matchesSearch = demand.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demand.demand_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demand.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || demand.type === filterType;
    const matchesPriority = !filterPriority || demand.priority === filterPriority;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'open' && !['closed', 'cancelled'].includes(demand.status)) ||
      (activeTab === 'closed' && demand.status === 'closed');
    
    return matchesSearch && matchesType && matchesPriority && matchesTab;
  });

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
          <h1 className="text-3xl font-bold">Demandas</h1>
          <p className="text-muted-foreground">Gerencie tickets, bugs e melhorias</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Demanda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingDemand ? 'Editar Demanda' : 'Nova Demanda'}</DialogTitle>
                <DialogDescription>
                  {editingDemand ? 'Atualize as informações da demanda' : 'Registre uma nova demanda'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="instance_id">Instância *</Label>
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
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Descreva brevemente a demanda"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_hours">Horas Estimadas</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                      min={0}
                      step={0.5}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva detalhadamente a demanda..."
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDemand ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Buscar demandas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {Object.entries(typeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas ({demands.length})</TabsTrigger>
          <TabsTrigger value="open">
            Abertas ({demands.filter(d => !['closed', 'cancelled'].includes(d.status)).length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Fechadas ({demands.filter(d => d.status === 'closed').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista de Demandas */}
      {filteredDemands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma demanda encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType || filterPriority ? 'Tente outros filtros' : 'Crie sua primeira demanda'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDemands.map((demand) => {
            const TypeIcon = typeConfig[demand.type]?.icon || RefreshCw;
            return (
              <Card key={demand.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${typeConfig[demand.type]?.color || 'bg-gray-500'} text-white`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">{demand.demand_number}</span>
                          <Badge className={priorityConfig[demand.priority]?.color}>
                            {priorityConfig[demand.priority]?.label}
                          </Badge>
                          <Badge variant="outline" className={statusConfig[demand.status]?.color + ' text-white'}>
                            {statusConfig[demand.status]?.label}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-lg">{demand.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {demand.client_name} • {demand.instance_name} • {demand.platform_name}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {demand.actual_hours || 0}h / {demand.estimated_hours || 0}h
                          </span>
                          {demand.sla_deadline && (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              SLA: {new Date(demand.sla_deadline).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={demand.status}
                        onValueChange={(value) => updateStatus(demand.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon">
                        <Timer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
