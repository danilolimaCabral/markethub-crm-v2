import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  CheckSquare,
  Plus,
  AlertCircle,
  Loader2,
  Clock,
  Trophy,
  Target,
  Calendar,
  User,
  MessageSquare,
  Lock,
  ArrowUpRight,
  Star,
  Award,
  TrendingUp
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: number;
  assigned_to_name: string;
  created_by_name: string;
  due_date: string;
  category: string;
  comment_count: number;
}

interface TaskSummary {
  pending: number;
  in_progress: number;
  completed: number;
  canceled: number;
  overdue: number;
  due_today: number;
}

interface LeaderboardEntry {
  user_id: number;
  full_name: string;
  total_points: number;
  achievements_count: number;
}

interface UserStats {
  user_id: number;
  full_name: string;
  pending: number;
  in_progress: number;
  completed: number;
  total: number;
}

export default function GestaoEquipe() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [error, setError] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    category: '',
    assigned_to: ''
  });

  useEffect(() => {
    loadData();
  }, [filterStatus, filterPriority]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      // Carregar tarefas
      let url = '/api/tasks?limit=50';
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterPriority !== 'all') url += `&priority=${filterPriority}`;

      const tasksRes = await fetch(url, { headers });
      if (tasksRes.status === 403) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks);
      }

      // Carregar resumo
      const summaryRes = await fetch('/api/tasks/dashboard/summary', { headers });
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      // Carregar leaderboard
      const leaderboardRes = await fetch('/api/tasks/leaderboard?period=month', { headers });
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data);
      }

      // Carregar stats por usuário
      const statsRes = await fetch('/api/tasks/dashboard/by-user', { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setUserStats(data);
      }
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        setShowAddTask(false);
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          due_date: '',
          category: '',
          assigned_to: ''
        });
        loadData();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao criar tarefa');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadData();
      }
    } catch (err) {
      setError('Erro ao atualizar tarefa');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      urgent: { variant: 'destructive', label: 'Urgente' },
      high: { variant: 'default', label: 'Alta' },
      medium: { variant: 'secondary', label: 'Média' },
      low: { variant: 'outline', label: 'Baixa' }
    };
    const c = config[priority] || config.medium;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'Em Progresso' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Concluída' },
      canceled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelada' }
    };
    const c = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
  };

  // Tela de acesso negado
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="text-center py-12">
          <CardContent>
            <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Módulo Não Disponível</h2>
            <p className="text-gray-500 mb-6">
              O módulo de Gestão de Equipe não está incluído no seu plano atual.
            </p>
            <Button onClick={() => window.location.href = '/settings/subscription'}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Fazer Upgrade do Plano
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-indigo-600" />
            Gestão de Equipe
          </h1>
          <p className="text-gray-500">Gerencie tarefas e acompanhe a produtividade</p>
        </div>
        <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
              <DialogDescription>Crie uma nova tarefa para a equipe</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Título da tarefa"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Descreva a tarefa..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  placeholder="Ex: Vendas, Operacional"
                />
              </div>
              <Button onClick={handleAddTask} className="w-full">
                Criar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
              <p className="text-xs text-gray-500">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{summary.in_progress}</p>
              <p className="text-xs text-gray-500">Em Progresso</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
              <p className="text-xs text-gray-500">Concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-red-600">{summary.overdue}</p>
              <p className="text-xs text-gray-500">Atrasadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{summary.due_today}</p>
              <p className="text-xs text-gray-500">Vencem Hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{summary.canceled}</p>
              <p className="text-xs text-gray-500">Canceladas</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Lista de Tarefas
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{task.title}</h3>
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {task.assigned_to_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assigned_to_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </span>
                          )}
                          {task.comment_count > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {task.comment_count}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                          >
                            Iniciar
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma tarefa encontrada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Produtividade da Equipe
              </CardTitle>
              <CardDescription>Acompanhe o desempenho de cada membro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userStats.map((user) => (
                  <div key={user.user_id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{user.full_name}</h3>
                          <p className="text-sm text-gray-500">{user.total} tarefas no total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{user.completed}</p>
                        <p className="text-xs text-gray-500">concluídas</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-2 bg-yellow-50 rounded">
                        <p className="font-medium text-yellow-700">{user.pending}</p>
                        <p className="text-xs text-yellow-600">Pendentes</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="font-medium text-blue-700">{user.in_progress}</p>
                        <p className="text-xs text-blue-600">Em Progresso</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <p className="font-medium text-green-700">{user.completed}</p>
                        <p className="text-xs text-green-600">Concluídas</p>
                      </div>
                    </div>
                    {user.total > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Taxa de conclusão</span>
                          <span>{Math.round((user.completed / user.total) * 100)}%</span>
                        </div>
                        <Progress value={(user.completed / user.total) * 100} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking do Mês
              </CardTitle>
              <CardDescription>Os colaboradores mais produtivos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`p-4 rounded-lg flex items-center justify-between ${
                      index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
                      index === 1 ? 'bg-gray-50 border border-gray-200' :
                      index === 2 ? 'bg-orange-50 border border-orange-200' :
                      'bg-white border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{entry.full_name}</h3>
                        <p className="text-sm text-gray-500">
                          {entry.achievements_count} conquistas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-xl font-bold">{entry.total_points}</span>
                      <span className="text-sm text-gray-500">pts</span>
                    </div>
                  </div>
                ))}

                {leaderboard.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum ponto registrado ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Badges e Conquistas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                Conquistas Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Primeira Tarefa', desc: 'Complete sua primeira tarefa', points: 10 },
                  { name: 'Produtivo', desc: 'Complete 10 tarefas', points: 50 },
                  { name: 'Pontual', desc: 'Complete 5 tarefas no prazo', points: 30 },
                  { name: 'Mestre', desc: 'Complete 50 tarefas', points: 200 },
                ].map((badge) => (
                  <div key={badge.name} className="p-4 border rounded-lg text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <h4 className="font-medium text-sm">{badge.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{badge.desc}</p>
                    <Badge variant="secondary">{badge.points} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
