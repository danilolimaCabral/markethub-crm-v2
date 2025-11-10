import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Eye, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { REAL_METRICS } from "@/data/real-data";
import SyncIndicator from "@/components/SyncIndicator";

// Gerar pedidos mockados baseados nos dados reais
const generateOrders = () => {
  const statuses = ['pendente', 'conferido', 'enviado', 'entregue', 'cancelado'];
  const produtos = [
    'Antena Digital 4K HDTV',
    'Conversor HDMI para VGA',
    'Acabamento Rack 19" 1U',
    'Adaptador USB WiFi AC1200',
    'Gel Blaster Pistola Tática',
    'Cabo HDMI 2.0 3m',
    'Drone Mini Brinquedo',
    'Tablet 10" Android'
  ];
  
  const clientes = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Mendes',
    'Juliana Lima', 'Roberto Alves', 'Fernanda Souza', 'Lucas Pereira', 'Camila Rocha'
  ];

  const orders = [];
  for (let i = 1; i <= REAL_METRICS.totalPedidos; i++) {
    const status = i <= REAL_METRICS.pedidosConferidos ? 'conferido' : 
                   i <= REAL_METRICS.pedidosConferidos + 50 ? 'enviado' :
                   i <= REAL_METRICS.pedidosConferidos + 80 ? 'entregue' :
                   i <= REAL_METRICS.pedidosConferidos + 90 ? 'cancelado' : 'pendente';
    
    orders.push({
      id: `ML-2025${String(i).padStart(6, '0')}`,
      cliente: clientes[Math.floor(Math.random() * clientes.length)],
      produto: produtos[Math.floor(Math.random() * produtos.length)],
      valor: Math.floor(Math.random() * 500) + 50,
      status,
      marketplace: 'Mercado Livre',
      data: new Date(2025, 9, Math.floor(Math.random() * 30) + 1).toLocaleDateString('pt-BR')
    });
  }
  
  return orders.reverse(); // Mais recentes primeiro
};

const allOrders = generateOrders();

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ReactNode, label: string }> = {
    pendente: { variant: "outline", icon: <Clock className="w-3 h-3" />, label: "Pendente" },
    conferido: { variant: "secondary", icon: <Package className="w-3 h-3" />, label: "Conferido" },
    enviado: { variant: "default", icon: <Truck className="w-3 h-3" />, label: "Enviado" },
    entregue: { variant: "default", icon: <CheckCircle className="w-3 h-3" />, label: "Entregue" },
    cancelado: { variant: "destructive", icon: <XCircle className="w-3 h-3" />, label: "Cancelado" },
  };
  
  const config = variants[status] || variants.pendente;
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      {config.icon}
      {config.label}
    </Badge>
  );
};

export default function Pedidos() {
  const recentOrders = allOrders.slice(0, 50); // Mostrar primeiros 50

  const stats = [
    {
      title: "Total de Pedidos",
      value: REAL_METRICS.totalPedidos.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Pedidos Pendentes",
      value: REAL_METRICS.pedidosPendentes.toString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Pedidos Conferidos",
      value: REAL_METRICS.pedidosConferidos.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Ticket Médio",
      value: `R$ ${REAL_METRICS.ticketMedio}`,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos do seu e-commerce</p>
      </div>

      {/* Sync Indicator */}
      <SyncIndicator />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Pedidos</CardTitle>
              <CardDescription>Últimos 50 pedidos do Mercado Livre</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por ID, cliente ou produto..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">ID Pedido</th>
                  <th className="text-left p-3 text-sm font-medium">Cliente</th>
                  <th className="text-left p-3 text-sm font-medium">Produto</th>
                  <th className="text-left p-3 text-sm font-medium">Valor</th>
                  <th className="text-left p-3 text-sm font-medium">Data</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, index) => (
                  <tr key={order.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="p-3 text-sm font-mono">{order.id}</td>
                    <td className="p-3 text-sm">{order.cliente}</td>
                    <td className="p-3 text-sm">{order.produto}</td>
                    <td className="p-3 text-sm font-medium">R$ {order.valor.toFixed(2)}</td>
                    <td className="p-3 text-sm text-muted-foreground">{order.data}</td>
                    <td className="p-3">{getStatusBadge(order.status)}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Mostrando 50 de {REAL_METRICS.totalPedidos} pedidos
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
