import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Server, Users, FileText, DollarSign } from 'lucide-react';

import { toast } from 'sonner';

interface Platform {
  id: string;
  name: string;
  description: string;
  stack: string;
  version: string;
  roadmap: string;
  sla_hours: number;
  is_active: boolean;
  instances_count: number;
  active_contracts: number;
  total_mrr: number;
  created_at: string;
}

export default function Platforms() {
  const token = localStorage.getItem('markethub_token');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stack: '',
    version: '',
    roadmap: '',
    sla_hours: 24
  });

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/control-tower/platforms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data);
      }
    } catch (error) {
      console.error('Erro ao carregar plataformas:', error);
      toast.error('Erro ao carregar plataformas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPlatform 
        ? `/api/control-tower/platforms/${editingPlatform.id}`
        : '/api/control-tower/platforms';
      
      const response = await fetch(url, {
        method: editingPlatform ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingPlatform ? 'Plataforma atualizada!' : 'Plataforma criada!');
        setDialogOpen(false);
        resetForm();
        fetchPlatforms();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar plataforma');
      }
    } catch (error) {
      console.error('Erro ao salvar plataforma:', error);
      toast.error('Erro ao salvar plataforma');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta plataforma?')) return;
    
    try {
      const response = await fetch(`/api/control-tower/platforms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Plataforma excluída!');
        fetchPlatforms();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir plataforma');
      }
    } catch (error) {
      console.error('Erro ao excluir plataforma:', error);
      toast.error('Erro ao excluir plataforma');
    }
  };

  const openEditDialog = (platform: Platform) => {
    setEditingPlatform(platform);
    setFormData({
      name: platform.name,
      description: platform.description || '',
      stack: platform.stack || '',
      version: platform.version || '',
      roadmap: platform.roadmap || '',
      sla_hours: platform.sla_hours
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPlatform(null);
    setFormData({
      name: '',
      description: '',
      stack: '',
      version: '',
      roadmap: '',
      sla_hours: 24
    });
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
          <h1 className="text-3xl font-bold">Plataformas</h1>
          <p className="text-muted-foreground">Gerencie seus sistemas e produtos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Plataforma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPlatform ? 'Editar Plataforma' : 'Nova Plataforma'}</DialogTitle>
                <DialogDescription>
                  {editingPlatform ? 'Atualize as informações da plataforma' : 'Cadastre um novo sistema ou produto'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: MarketHub CRM"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Versão</Label>
                    <Input
                      id="version"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="Ex: 2.0.0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o sistema..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stack">Stack Tecnológica</Label>
                    <Input
                      id="stack"
                      value={formData.stack}
                      onChange={(e) => setFormData({ ...formData, stack: e.target.value })}
                      placeholder="Ex: React, Node.js, PostgreSQL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sla_hours">SLA (horas)</Label>
                    <Input
                      id="sla_hours"
                      type="number"
                      value={formData.sla_hours}
                      onChange={(e) => setFormData({ ...formData, sla_hours: parseInt(e.target.value) })}
                      min={1}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roadmap">Roadmap</Label>
                  <Textarea
                    id="roadmap"
                    value={formData.roadmap}
                    onChange={(e) => setFormData({ ...formData, roadmap: e.target.value })}
                    placeholder="Próximas funcionalidades planejadas..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlatform ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Plataformas */}
      {platforms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma plataforma cadastrada</h3>
            <p className="text-muted-foreground mb-4">Comece cadastrando seu primeiro sistema</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Plataforma
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <Card key={platform.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {platform.name}
                      {platform.version && (
                        <Badge variant="outline">v{platform.version}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{platform.stack}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(platform)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(platform.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {platform.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {platform.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span>{platform.instances_count} instâncias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{platform.active_contracts} contratos</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      R$ {Number(platform.total_mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MRR
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Badge variant="secondary">SLA: {platform.sla_hours}h</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
