import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Eye, XCircle, CheckCircle, AlertCircle, Search, Filter } from "lucide-react";
import { useState } from "react";

// Gerar notas fiscais baseadas nos pedidos reais
const notasFiscais = Array.from({ length: 821 }, (_, i) => {
  const numero = 100000 + i;
  const valor = Math.floor(Math.random() * 2000) + 100;
  const data = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  const statusOptions = [
    { status: 'Emitida', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { status: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle },
    { status: 'Denegada', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  ];
  const statusRandom = statusOptions[Math.floor(Math.random() * 10) > 8 ? Math.floor(Math.random() * 3) : 0]; // 80% emitidas
  
  return {
    id: i + 1,
    numero: numero.toString(),
    serie: '1',
    chave: `${numero}${Math.random().toString(36).substring(2, 15)}`.substring(0, 44),
    cliente: `Cliente ${i + 1}`,
    cnpjCpf: Math.random() > 0.5 
      ? `${Math.floor(Math.random() * 90000000) + 10000000}.${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 90) + 10}`
      : `${Math.floor(Math.random() * 90000000000) + 10000000000}/${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 90) + 10}`,
    valor: valor,
    data: data.toISOString().split('T')[0],
    status: statusRandom.status,
    statusColor: statusRandom.color,
    StatusIcon: statusRandom.icon,
    pedido: `#${String(i + 1).padStart(6, '0')}`,
  };
});

export default function NotasFiscais() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Filtrar notas
  const notasFiltradas = notasFiscais.filter(nf => {
    const matchBusca = busca === '' || 
      nf.numero.includes(busca) ||
      nf.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      nf.pedido.includes(busca);
    
    const matchStatus = filtroStatus === 'todos' || nf.status === filtroStatus;
    
    return matchBusca && matchStatus;
  });

  // Estatísticas
  const stats = {
    total: notasFiscais.length,
    emitidas: notasFiscais.filter(nf => nf.status === 'Emitida').length,
    canceladas: notasFiscais.filter(nf => nf.status === 'Cancelada').length,
    denegadas: notasFiscais.filter(nf => nf.status === 'Denegada').length,
    valorTotal: notasFiscais.reduce((acc, nf) => acc + nf.valor, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notas Fiscais</h1>
        <p className="text-muted-foreground">Gestão de NF-e emitidas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de NF-e</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emitidas</p>
                <p className="text-2xl font-bold text-green-600">{stats.emitidas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold text-red-600">{stats.canceladas}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Denegadas</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.denegadas}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {(stats.valorTotal / 1000).toFixed(0)}k
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
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
                placeholder="Buscar por número, cliente ou pedido..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filtroStatus === 'todos' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('todos')}
              >
                Todas
              </Button>
              <Button
                variant={filtroStatus === 'Emitida' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('Emitida')}
              >
                Emitidas
              </Button>
              <Button
                variant={filtroStatus === 'Cancelada' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('Cancelada')}
              >
                Canceladas
              </Button>
              <Button
                variant={filtroStatus === 'Denegada' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('Denegada')}
              >
                Denegadas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notas Fiscais */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Fiscais Emitidas</CardTitle>
          <CardDescription>
            {notasFiltradas.length} nota(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabela Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Número</th>
                  <th className="text-left p-3 font-semibold">Série</th>
                  <th className="text-left p-3 font-semibold">Cliente</th>
                  <th className="text-left p-3 font-semibold">CPF/CNPJ</th>
                  <th className="text-left p-3 font-semibold">Pedido</th>
                  <th className="text-left p-3 font-semibold">Valor</th>
                  <th className="text-left p-3 font-semibold">Data</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {notasFiltradas.slice(0, 50).map((nf) => {
                  const StatusIcon = nf.StatusIcon;
                  return (
                    <tr key={nf.id} className="border-b hover:bg-accent">
                      <td className="p-3 font-mono">{nf.numero}</td>
                      <td className="p-3">{nf.serie}</td>
                      <td className="p-3">{nf.cliente}</td>
                      <td className="p-3 font-mono text-sm">{nf.cnpjCpf}</td>
                      <td className="p-3 font-mono">{nf.pedido}</td>
                      <td className="p-3 font-bold text-green-600">
                        R$ {nf.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">{new Date(nf.data).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3">
                        <Badge className={nf.statusColor}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {nf.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
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
            {notasFiltradas.slice(0, 50).map((nf) => {
              const StatusIcon = nf.StatusIcon;
              return (
                <Card key={nf.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold font-mono">NF-e {nf.numero}</p>
                        <p className="text-sm text-muted-foreground">{nf.cliente}</p>
                      </div>
                      <Badge className={nf.statusColor}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {nf.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Pedido:</span> {nf.pedido}</p>
                      <p><span className="text-muted-foreground">CPF/CNPJ:</span> {nf.cnpjCpf}</p>
                      <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-green-600">R$ {nf.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                      <p><span className="text-muted-foreground">Data:</span> {new Date(nf.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
