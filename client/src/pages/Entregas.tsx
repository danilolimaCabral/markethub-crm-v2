import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  MapPin,
  Calendar
} from "lucide-react";
import { useState } from "react";

// Gerar entregas baseadas nos pedidos reais
const gerarEntregas = () => {
  const transportadoras = ['Correios', 'Jadlog', 'Total Express', 'Azul Cargo', 'Mercado Envios'];
  const cidades = [
    'São Paulo - SP', 'Rio de Janeiro - RJ', 'Belo Horizonte - MG', 'Curitiba - PR',
    'Porto Alegre - RS', 'Salvador - BA', 'Brasília - DF', 'Fortaleza - CE',
    'Recife - PE', 'Manaus - AM', 'Goiânia - GO', 'Campinas - SP'
  ];
  
  const entregas = [];
  const hoje = new Date();
  
  for (let i = 1; i <= 340; i++) {
    const diasAtras = Math.floor(Math.random() * 15);
    const dataEnvio = new Date(hoje);
    dataEnvio.setDate(dataEnvio.getDate() - diasAtras);
    
    const prazoEntrega = Math.floor(Math.random() * 7) + 3;
    const dataPrevisao = new Date(dataEnvio);
    dataPrevisao.setDate(dataPrevisao.getDate() + prazoEntrega);
    
    let status: 'pendente' | 'coletado' | 'em_transito' | 'saiu_entrega' | 'entregue' | 'atrasado';
    
    if (diasAtras === 0) {
      status = 'pendente';
    } else if (diasAtras <= 1) {
      status = 'coletado';
    } else if (diasAtras <= 3) {
      status = 'em_transito';
    } else if (diasAtras <= 5) {
      status = 'saiu_entrega';
    } else if (dataPrevisao < hoje && Math.random() > 0.8) {
      status = 'atrasado';
    } else {
      status = 'entregue';
    }
    
    entregas.push({
      id: i,
      pedidoId: `#${String(i).padStart(6, '0')}`,
      cliente: `Cliente ${i}`,
      destino: cidades[Math.floor(Math.random() * cidades.length)],
      transportadora: transportadoras[Math.floor(Math.random() * transportadoras.length)],
      codigoRastreio: `BR${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}BR`,
      dataEnvio: dataEnvio.toISOString().split('T')[0],
      previsaoEntrega: dataPrevisao.toISOString().split('T')[0],
      status,
      valor: Math.floor(Math.random() * 500) + 50
    });
  }
  
  return entregas.sort((a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime());
};

const entregas = gerarEntregas();

export default function Entregas() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const getStatusConfig = (status: string) => {
    const configs = {
      pendente: {
        variant: "secondary" as const,
        label: "Pendente Coleta",
        icon: <Clock className="w-3 h-3" />,
        color: "text-gray-600"
      },
      coletado: {
        variant: "default" as const,
        label: "Coletado",
        icon: <Package className="w-3 h-3" />,
        color: "text-blue-600"
      },
      em_transito: {
        variant: "default" as const,
        label: "Em Trânsito",
        icon: <Truck className="w-3 h-3" />,
        color: "text-blue-600"
      },
      saiu_entrega: {
        variant: "default" as const,
        label: "Saiu para Entrega",
        icon: <MapPin className="w-3 h-3" />,
        color: "text-purple-600"
      },
      entregue: {
        variant: "default" as const,
        label: "Entregue",
        icon: <CheckCircle className="w-3 h-3" />,
        color: "text-green-600"
      },
      atrasado: {
        variant: "destructive" as const,
        label: "Atrasado",
        icon: <AlertCircle className="w-3 h-3" />,
        color: "text-red-600"
      }
    };
    return configs[status as keyof typeof configs];
  };

  const entregasFiltradas = entregas.filter(e => {
    const matchBusca = e.pedidoId.toLowerCase().includes(busca.toLowerCase()) ||
                       e.cliente.toLowerCase().includes(busca.toLowerCase()) ||
                       e.codigoRastreio.toLowerCase().includes(busca.toLowerCase()) ||
                       e.destino.toLowerCase().includes(busca.toLowerCase());
    
    const matchStatus = filtroStatus === "todos" || e.status === filtroStatus;
    
    return matchBusca && matchStatus;
  });

  const totalEntregas = entregas.length;
  const pendentes = entregas.filter(e => e.status === 'pendente').length;
  const emTransito = entregas.filter(e => e.status === 'em_transito' || e.status === 'coletado' || e.status === 'saiu_entrega').length;
  const entregues = entregas.filter(e => e.status === 'entregue').length;
  const atrasadas = entregas.filter(e => e.status === 'atrasado').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Truck className="w-8 h-8" />
          Entregas
        </h1>
        <p className="text-muted-foreground">Gestão e rastreamento de entregas</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total de Entregas</p>
                <p className="text-2xl font-bold">{totalEntregas}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-gray-600">{pendentes}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Em Trânsito</p>
                <p className="text-2xl font-bold text-blue-600">{emTransito}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold text-green-600">{entregues}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Entregas Atrasadas */}
      {atrasadas > 0 && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-bold text-red-700 dark:text-red-300">
                    {atrasadas} entrega(s) atrasada(s)
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Ação necessária para evitar reclamações
                  </p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setFiltroStatus('atrasado')}
              >
                Ver Atrasadas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por pedido, cliente, código de rastreio..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filtroStatus === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroStatus("todos")}
          >
            Todos
          </Button>
          <Button
            variant={filtroStatus === "pendente" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroStatus("pendente")}
          >
            Pendentes
          </Button>
          <Button
            variant={filtroStatus === "em_transito" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroStatus("em_transito")}
          >
            Em Trânsito
          </Button>
          <Button
            variant={filtroStatus === "entregue" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroStatus("entregue")}
          >
            Entregues
          </Button>
          <Button
            variant={filtroStatus === "atrasado" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFiltroStatus("atrasado")}
          >
            Atrasadas
          </Button>
        </div>
      </div>

      {/* Lista de Entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Entregas ({entregasFiltradas.length})</CardTitle>
          <CardDescription>Acompanhamento de todas as entregas em andamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entregasFiltradas.slice(0, 50).map((entrega) => {
              const statusConfig = getStatusConfig(entrega.status);
              
              return (
                <div key={entrega.id} className="border rounded-lg p-4 hover:bg-accent">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold">{entrega.pedidoId}</h4>
                        <Badge {...statusConfig} className="flex items-center gap-1">
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{entrega.cliente}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{entrega.destino}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span>{entrega.transportadora}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-1">
                      <p className="text-xs text-muted-foreground">Código de Rastreio</p>
                      <p className="font-mono text-sm font-medium">{entrega.codigoRastreio}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Previsão: {new Date(entrega.previsaoEntrega).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Rastrear
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {entregasFiltradas.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma entrega encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
