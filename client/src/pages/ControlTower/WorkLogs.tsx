import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { 
  Plus, Play, Pause, Square, Clock, Timer, Calendar, 
  CheckCircle, XCircle, DollarSign
} from 'lucide-react';

import { toast } from 'sonner';

interface WorkLog {
  id: string;
  demand_id: string;
  demand_number: string;
  demand_title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  description: string;
  activity_type: string;
  is_billable: boolean;
  is_approved: boolean;
  client_name: string;
  instance_name: string;
}

interface Demand {
  id: string;
  demand_number: string;
  title: string;
  client_name: string;
  instance_name: string;
}

interface ActiveTimer {
  id: string;
  demand_id: string;
  start_time: string;
  demand_number: string;
  demand_title: string;
}

const activityTypes: Record<string, string> = {
  development: 'Desenvolvimento',
  analysis: 'Análise',
  testing: 'Testes',
  meeting: 'Reunião',
  support: 'Suporte',
  documentation: 'Documentação',
  review: 'Revisão',
  deployment: 'Deploy',
  other: 'Outros'
};

export default function WorkLogs() {
  const token = localStorage.getItem('markethub_token');
  const [worklogs, setWorklogs] = useState<WorkLog[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    demand_id: '',
    start_time: '',
    end_time: '',
    description: '',
    activity_type: 'development',
    is_billable: true
  });

  useEffect(() => {
    fetchWorklogs();
    fetchDemands();
    checkActiveTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        const start = new Date(activeTimer.start_time);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimerDisplay(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setTimerDisplay('00:00:00');
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimer]);

  const fetchWorklogs = async () => {
    try {
      const response = await fetch('/api/control-tower/worklogs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWorklogs(data);
      }
    } catch (error) {
      console.error('Erro ao carregar apontamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemands = async () => {
    try {
      const response = await fetch('/api/control-tower/demands?status=open', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDemands(data);
      }
    } catch (error) {
      console.error('Erro ao carregar demandas:', error);
    }
  };

  const checkActiveTimer = async () => {
    try {
      const response = await fetch('/api/control-tower/worklogs/timer/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setActiveTimer(data);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar timer:', error);
    }
  };

  const startTimer = async (demandId: string) => {
    try {
      const response = await fetch('/api/control-tower/worklogs/timer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ demand_id: demandId })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveTimer(data);
        toast.success('Timer iniciado!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao iniciar timer');
      }
    } catch (error) {
      console.error('Erro ao iniciar timer:', error);
      toast.error('Erro ao iniciar timer');
    }
  };

  const stopTimer = async (description: string = '', activityType: string = 'development') => {
    if (!activeTimer) return;

    try {
      const response = await fetch('/api/control-tower/worklogs/timer/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          worklog_id: activeTimer.id,
          description,
          activity_type: activityType
        })
      });

      if (response.ok) {
        setActiveTimer(null);
        toast.success('Timer parado!');
        fetchWorklogs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao parar timer');
      }
    } catch (error) {
      console.error('Erro ao parar timer:', error);
      toast.error('Erro ao parar timer');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/control-tower/worklogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Apontamento registrado!');
        setDialogOpen(false);
        resetForm();
        fetchWorklogs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao registrar apontamento');
      }
    } catch (error) {
      console.error('Erro ao registrar apontamento:', error);
      toast.error('Erro ao registrar apontamento');
    }
  };

  const resetForm = () => {
    setFormData({
      demand_id: '',
      start_time: '',
      end_time: '',
      description: '',
      activity_type: 'development',
      is_billable: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  // Calcular totais
  const totalHours = worklogs.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / 60;
  const billableHours = worklogs.filter(w => w.is_billable).reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / 60;
  const approvedHours = worklogs.filter(w => w.is_approved).reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / 60;

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
          <h1 className="text-3xl font-bold">Apontamento de Horas</h1>
          <p className="text-muted-foreground">Registre e gerencie seu tempo</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Apontamento Manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleManualSubmit}>
              <DialogHeader>
                <DialogTitle>Apontamento Manual</DialogTitle>
                <DialogDescription>Registre horas trabalhadas manualmente</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Demanda *</Label>
                  <Select
                    value={formData.demand_id}
                    onValueChange={(value) => setFormData({ ...formData, demand_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a demanda" />
                    </SelectTrigger>
                    <SelectContent>
                      {demands.map((demand) => (
                        <SelectItem key={demand.id} value={demand.id}>
                          {demand.demand_number} - {demand.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Atividade</Label>
                  <Select
                    value={formData.activity_type}
                    onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(activityTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="O que foi feito..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_billable"
                    checked={formData.is_billable}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_billable: checked })}
                  />
                  <Label htmlFor="is_billable">Faturável</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timer Ativo */}
      <Card className={activeTimer ? 'border-primary bg-primary/5' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTimer ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-5xl font-mono font-bold text-primary">{timerDisplay}</div>
                <p className="text-muted-foreground mt-2">
                  {activeTimer.demand_number} - {activeTimer.demand_title}
                </p>
              </div>
              <div className="flex justify-center">
                <Button 
                  variant="destructive" 
                  size="lg"
                  onClick={() => {
                    const description = prompt('Descrição do trabalho realizado:');
                    stopTimer(description || '');
                  }}
                >
                  <Square className="w-5 h-5 mr-2" />
                  Parar Timer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">Selecione uma demanda para iniciar o timer</p>
              <Select onValueChange={(value) => startTimer(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma demanda para iniciar" />
                </SelectTrigger>
                <SelectContent>
                  {demands.map((demand) => (
                    <SelectItem key={demand.id} value={demand.id}>
                      {demand.demand_number} - {demand.title} ({demand.client_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Horas Faturáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{billableHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Horas Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{approvedHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Apontamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Apontamentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {worklogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum apontamento registrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Demanda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worklogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{new Date(log.start_time).toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {log.end_time && ` - ${new Date(log.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{log.demand_number}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{log.demand_title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{log.client_name}</p>
                        <p className="text-sm text-muted-foreground">{log.instance_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{activityTypes[log.activity_type] || log.activity_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatDuration(log.duration_minutes)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {log.is_billable && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Faturável
                          </Badge>
                        )}
                        {log.is_approved && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovado
                          </Badge>
                        )}
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
