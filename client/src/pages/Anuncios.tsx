import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Megaphone,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  RefreshCw
} from 'lucide-react';

interface Anuncio {
  id: string;
  titulo: string;
  sku: string;
  marketplace: string;
  preco: number;
  estoque: number;
  visitas: number;
  vendas: number;
  status: 'ativo' | 'pausado' | 'finalizado';
  conversao: number;
}

export default function Anuncios() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Dados de exemplo
  const anuncios: Anuncio[] = [
    {
      id: 'MLB-001',
      titulo: 'Cabo HDMI 2.0 3m Alta Velocidade 4K',
      sku: 'SKU-00004',
      marketplace: 'Mercado Livre',
      preco: 68.00,
      estoque: 44,
      visitas: 1250,
      vendas: 156,
      status: 'ativo',
      conversao: 12.48
    },
    {
      id: 'MLB-002',
      titulo: 'Conversor HDMI para VGA com Áudio',
      sku: 'SKU-00005',
      marketplace: 'Mercado Livre',
      preco: 54.00,
      estoque: 69,
      visitas: 890,
      vendas: 98,
      status: 'ativo',
      conversao: 11.01
    },
    {
      id: 'MLB-003',
      titulo: 'Antena Digital 4K HDTV Interna',
      sku: 'SKU-00001',
      marketplace: 'Mercado Livre',
      preco: 293.00,
      estoque: 86,
      visitas: 2340,
      vendas: 234,
      status: 'ativo',
      conversao: 10.00
    },
    {
      id: 'MLB-004',
      titulo: 'Drone Mini Brinquedo com Câmera',
      sku: 'SKU-00008',
      marketplace: 'Mercado Livre',
      preco: 403.00,
      estoque: 39,
      visitas: 3450,
      vendas: 189,
      status: 'ativo',
      conversao: 5.48
    },
    {
      id: 'MLB-005',
      titulo: 'Tablet 10" Android 128GB',
      sku: 'SKU-00009',
      marketplace: 'Mercado Livre',
      preco: 275.00,
      estoque: 0,
      visitas: 1890,
      vendas: 145,
      status: 'pausado',
      conversao: 7.67
    },
    {
      id: 'MLB-006',
      titulo: 'Adaptador USB WiFi AC1200 Dual Band',
      sku: 'SKU-00016',
      marketplace: 'Mercado Livre',
      preco: 174.00,
      estoque: 59,
      visitas: 670,
      vendas: 78,
      status: 'ativo',
      conversao: 11.64
    },
    {
      id: 'MLB-007',
      titulo: 'Gel Blaster Pistola Tática Automática',
      sku: 'SKU-00002',
      marketplace: 'Mercado Livre',
      preco: 103.00,
      estoque: 81,
      visitas: 4560,
      vendas: 567,
      status: 'ativo',
      conversao: 12.43
    },
  ];

  const anunciosFiltrados = anuncios.filter(anuncio => {
    const matchBusca = anuncio.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                      anuncio.sku.toLowerCase().includes(busca.toLowerCase()) ||
                      anuncio.id.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || anuncio.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const totalAnuncios = anuncios.length;
  const anunciosAtivos = anuncios.filter(a => a.status === 'ativo').length;
  const anunciosPausados = anuncios.filter(a => a.status === 'pausado').length;
  const totalVisitas = anuncios.reduce((sum, a) => sum + a.visitas, 0);
  const taxaConversaoMedia = (anuncios.reduce((sum, a) => sum + a.conversao, 0) / anuncios.length).toFixed(2);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Ativo</Badge>;
      case 'pausado':
        return <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">Pausado</Badge>;
      case 'finalizado':
        return <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">Finalizado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-red-500" />
          Anúncios
        </h1>
        <p className="text-muted-foreground">
          Gerencie seus anúncios em marketplaces
        </p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Anúncios</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnuncios}</div>
            <p className="text-xs text-muted-foreground">
              Em todos os marketplaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anúncios Ativos</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{anunciosAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Publicados e visíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausados</CardTitle>
            <Pause className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{anunciosPausados}</div>
            <p className="text-xs text-muted-foreground">
              Sem estoque ou pausados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visitas</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitas.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Visualizações totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaConversaoMedia}%</div>
            <p className="text-xs text-muted-foreground">
              Média de conversão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lista de Anúncios</CardTitle>
              <CardDescription>
                Gerencie e monitore seus anúncios ativos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Anúncio
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca e Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por título, SKU ou ID..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="pausado">Pausados</SelectItem>
                <SelectItem value="finalizado">Finalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Visitas</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Conversão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anunciosFiltrados.map((anuncio) => (
                  <TableRow key={anuncio.id}>
                    <TableCell className="font-mono text-sm">{anuncio.id}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      {anuncio.titulo}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{anuncio.sku}</TableCell>
                    <TableCell>{anuncio.marketplace}</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {anuncio.preco.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={anuncio.estoque === 0 ? 'text-red-500 font-medium' : ''}>
                        {anuncio.estoque} un
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{anuncio.visitas.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right">{anuncio.vendas}</TableCell>
                    <TableCell className="text-right">
                      <span className={anuncio.conversao >= 10 ? 'text-green-500 font-medium' : ''}>
                        {anuncio.conversao.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(anuncio.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {anuncio.status === 'ativo' ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {anunciosFiltrados.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum anúncio encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
