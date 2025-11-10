import { useState } from 'react';
import { Plus, Search, Filter, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Ticket {
  id: string;
  cliente: string;
  assunto: string;
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  pedido?: string;
  criado: Date;
  atualizado: Date;
  mensagens: number;
}

export default function PosVendas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Dados mockados
  const tickets: Ticket[] = [
    {
      id: 'TK-001',
      cliente: 'João Silva',
      assunto: 'Produto com defeito',
      status: 'aberto',
      prioridade: 'alta',
      pedido: 'PED-12345',
      criado: new Date('2025-11-04'),
      atualizado: new Date('2025-11-04'),
      mensagens: 3
    },
    {
      id: 'TK-002',
      cliente: 'Maria Santos',
      assunto: 'Dúvida sobre garantia',
      status: 'em_andamento',
      prioridade: 'media',
      pedido: 'PED-12346',
      criado: new Date('2025-11-03'),
      atualizado: new Date('2025-11-04'),
      mensagens: 5
    },
    {
      id: 'TK-003',
      cliente: 'Pedro Costa',
      assunto: 'Troca de produto',
      status: 'resolvido',
      prioridade: 'baixa',
      pedido: 'PED-12347',
      criado: new Date('2025-11-02'),
      atualizado: new Date('2025-11-03'),
      mensagens: 8
    },
    {
      id: 'TK-004',
      cliente: 'Ana Oliveira',
      assunto: 'Problema na entrega',
      status: 'aberto',
      prioridade: 'urgente',
      pedido: 'PED-12348',
      criado: new Date('2025-11-04'),
      atualizado: new Date('2025-11-04'),
      mensagens: 1
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto': return <AlertCircle className="w-4 h-4" />;
      case 'em_andamento': return <Clock className="w-4 h-4" />;
      case 'resolvido': return <CheckCircle className="w-4 h-4" />;
      case 'fechado': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'em_andamento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolvido': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'fechado': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return '';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'media': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'alta': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'urgente': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'aberto': 'Aberto',
      'em_andamento': 'Em Andamento',
      'resolvido': 'Resolvido',
      'fechado': 'Fechado'
    };
    return labels[status] || status;
  };

  const getPrioridadeLabel = (prioridade: string) => {
    const labels: Record<string, string> = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return labels[prioridade] || prioridade;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    abertos: tickets.filter(t => t.status === 'aberto').length,
    emAndamento: tickets.filter(t => t.status === 'em_andamento').length,
    resolvidos: tickets.filter(t => t.status === 'resolvido').length,
    total: tickets.length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pós-Vendas</h1>
        <p className="text-muted-foreground">Gestão de atendimento e suporte ao cliente</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Abertos</p>
              <p className="text-2xl font-bold text-foreground">{stats.abertos}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold text-foreground">{stats.emAndamento}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolvidos</p>
              <p className="text-2xl font-bold text-foreground">{stats.resolvidos}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por cliente, assunto ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="aberto">Abertos</TabsTrigger>
            <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
            <TabsTrigger value="resolvido">Resolvidos</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
                  <Badge className={getStatusColor(ticket.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(ticket.status)}
                      {getStatusLabel(ticket.status)}
                    </span>
                  </Badge>
                  <Badge className={getPrioridadeColor(ticket.prioridade)}>
                    {getPrioridadeLabel(ticket.prioridade)}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{ticket.assunto}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Cliente: {ticket.cliente}</span>
                  {ticket.pedido && <span>Pedido: {ticket.pedido}</span>}
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {ticket.mensagens} mensagens
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Criado: {ticket.criado.toLocaleDateString('pt-BR')}</p>
                <p>Atualizado: {ticket.atualizado.toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card className="p-12 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum ticket encontrado</p>
        </Card>
      )}
    </div>
  );
}
