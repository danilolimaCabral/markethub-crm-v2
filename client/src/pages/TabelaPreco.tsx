import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit,
  Save,
  X,
  Search,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

interface Produto {
  id: number;
  nome: string;
  categoria: string;
  precoAtual: number;
  precoMercado: {
    min: number;
    max: number;
    media: number;
  };
  precoSugerido: number;
  status: "barato" | "competitivo" | "caro";
  margem: number;
  vendidosMes: number;
}

const produtosIniciais: Produto[] = [
  {
    id: 1,
    nome: "Antena Digital Externa UHF/VHF",
    categoria: "Antenas",
    precoAtual: 89.90,
    precoMercado: { min: 75.00, max: 120.00, media: 95.00 },
    precoSugerido: 92.00,
    status: "competitivo",
    margem: 45,
    vendidosMes: 145
  },
  {
    id: 2,
    nome: "Conversor HDMI para RCA",
    categoria: "Conversores",
    precoAtual: 45.90,
    precoMercado: { min: 35.00, max: 65.00, media: 48.00 },
    precoSugerido: 47.00,
    status: "competitivo",
    margem: 52,
    vendidosMes: 89
  },
  {
    id: 3,
    nome: "Cabo HDMI 2.0 - 3 metros",
    categoria: "Cabos",
    precoAtual: 35.00,
    precoMercado: { min: 25.00, max: 45.00, media: 32.00 },
    precoSugerido: 30.00,
    status: "caro",
    margem: 65,
    vendidosMes: 234
  },
  {
    id: 4,
    nome: "Suporte TV LCD 32-55 polegadas",
    categoria: "Acabamentos",
    precoAtual: 79.90,
    precoMercado: { min: 85.00, max: 150.00, media: 110.00 },
    precoSugerido: 95.00,
    status: "barato",
    margem: 38,
    vendidosMes: 67
  },
  {
    id: 5,
    nome: "Repetidor WiFi 300Mbps",
    categoria: "Internet e Redes",
    precoAtual: 55.00,
    precoMercado: { min: 45.00, max: 80.00, media: 60.00 },
    precoSugerido: 58.00,
    status: "competitivo",
    margem: 48,
    vendidosMes: 123
  },
  {
    id: 6,
    nome: "Drone com Câmera HD",
    categoria: "Drones",
    precoAtual: 299.00,
    precoMercado: { min: 250.00, max: 450.00, media: 320.00 },
    precoSugerido: 310.00,
    status: "competitivo",
    margem: 42,
    vendidosMes: 34
  },
  {
    id: 7,
    nome: "Tablet 10 polegadas 64GB",
    categoria: "Tablets",
    precoAtual: 450.00,
    precoMercado: { min: 380.00, max: 550.00, media: 420.00 },
    precoSugerido: 410.00,
    status: "caro",
    margem: 35,
    vendidosMes: 45
  },
  {
    id: 8,
    nome: "Arma de Gel Elétrica",
    categoria: "Armas de Gel",
    precoAtual: 189.00,
    precoMercado: { min: 150.00, max: 250.00, media: 195.00 },
    precoSugerido: 190.00,
    status: "competitivo",
    margem: 50,
    vendidosMes: 78
  }
];

export default function TabelaPreco() {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [novoPreco, setNovoPreco] = useState<number>(0);
  const [busca, setBusca] = useState("");

  const handleEditar = (produto: Produto) => {
    setEditandoId(produto.id);
    setNovoPreco(produto.precoAtual);
  };

  const handleSalvar = (id: number) => {
    setProdutos(produtos.map(p => {
      if (p.id === id) {
        const diferenca = ((novoPreco - p.precoMercado.media) / p.precoMercado.media) * 100;
        let novoStatus: "barato" | "competitivo" | "caro" = "competitivo";
        
        if (diferenca > 10) novoStatus = "caro";
        else if (diferenca < -10) novoStatus = "barato";
        
        return { ...p, precoAtual: novoPreco, status: novoStatus };
      }
      return p;
    }));
    setEditandoId(null);
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setNovoPreco(0);
  };

  const handleAplicarSugestao = (id: number) => {
    setProdutos(produtos.map(p => {
      if (p.id === id) {
        return { ...p, precoAtual: p.precoSugerido, status: "competitivo" };
      }
      return p;
    }));
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      barato: {
        variant: "default" as const,
        label: "Abaixo do Mercado",
        icon: <TrendingDown className="w-3 h-3" />,
        color: "text-green-600"
      },
      competitivo: {
        variant: "secondary" as const,
        label: "Competitivo",
        icon: <Minus className="w-3 h-3" />,
        color: "text-gray-600"
      },
      caro: {
        variant: "destructive" as const,
        label: "Acima do Mercado",
        icon: <TrendingUp className="w-3 h-3" />,
        color: "text-red-600"
      }
    };
    return configs[status as keyof typeof configs];
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const totalProdutos = produtos.length;
  const competitivos = produtos.filter(p => p.status === "competitivo").length;
  const caros = produtos.filter(p => p.status === "caro").length;
  const baratos = produtos.filter(p => p.status === "barato").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="w-8 h-8" />
          Tabela de Preços
        </h1>
        <p className="text-muted-foreground">Gestão de preços com comparação de mercado</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{totalProdutos}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Competitivos</p>
                <p className="text-2xl font-bold text-green-600">{competitivos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Acima do Mercado</p>
                <p className="text-2xl font-bold text-red-600">{caros}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Abaixo do Mercado</p>
                <p className="text-2xl font-bold text-blue-600">{baratos}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar produtos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela de Preços */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Preços</CardTitle>
          <CardDescription>Compare seus preços com o mercado e ajuste para maximizar vendas e lucro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold">Produto</th>
                  <th className="text-right p-3 text-sm font-semibold">Preço Atual</th>
                  <th className="text-right p-3 text-sm font-semibold">Mercado (Média)</th>
                  <th className="text-right p-3 text-sm font-semibold">Diferença</th>
                  <th className="text-center p-3 text-sm font-semibold">Status</th>
                  <th className="text-right p-3 text-sm font-semibold">Preço Sugerido</th>
                  <th className="text-center p-3 text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((produto) => {
                  const diferenca = ((produto.precoAtual - produto.precoMercado.media) / produto.precoMercado.media) * 100;
                  const statusConfig = getStatusConfig(produto.status);
                  const estaEditando = editandoId === produto.id;

                  return (
                    <tr key={produto.id} className="border-b hover:bg-accent">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{produto.nome}</p>
                          <p className="text-xs text-muted-foreground">{produto.categoria}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {estaEditando ? (
                          <Input
                            type="number"
                            value={novoPreco}
                            onChange={(e) => setNovoPreco(parseFloat(e.target.value))}
                            className="w-24 text-right"
                            step="0.01"
                          />
                        ) : (
                          <p className="font-bold text-lg">
                            R$ {produto.precoAtual.toFixed(2)}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-sm">
                          <p className="font-medium">R$ {produto.precoMercado.media.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {produto.precoMercado.min.toFixed(2)} - R$ {produto.precoMercado.max.toFixed(2)}
                          </p>
                        </div>
                      </td>
                      <td className={`p-3 text-right font-bold ${
                        diferenca > 5 ? 'text-red-600' : diferenca < -5 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {diferenca > 0 ? '+' : ''}{diferenca.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center">
                        <Badge {...statusConfig} className="flex items-center gap-1 justify-center">
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-sm">
                          <p className="font-bold text-blue-600">
                            R$ {produto.precoSugerido.toFixed(2)}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6 px-2"
                            onClick={() => handleAplicarSugestao(produto.id)}
                          >
                            Aplicar
                          </Button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {estaEditando ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleSalvar(produto.id)}
                              className="h-8 px-2"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelar}
                              className="h-8 px-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditar(produto)}
                            className="h-8 px-3"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
