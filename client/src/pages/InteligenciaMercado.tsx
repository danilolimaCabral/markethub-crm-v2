import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Search,
  DollarSign,
  Package,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

// Dados mockados de comparação de mercado (baseados em produtos reais)
const produtosComparacao = [
  {
    id: 1,
    nome: "Antena Digital Externa UHF/VHF",
    categoria: "Antenas",
    meuPreco: 89.90,
    precoMercado: {
      min: 75.00,
      max: 120.00,
      media: 95.00
    },
    vendidosMes: 145,
    status: "competitivo",
    oportunidadeImportacao: {
      viavel: true,
      precoCIF: 25.00, // USD
      margemPotencial: 65,
      demandaEstimada: "Alta"
    }
  },
  {
    id: 2,
    nome: "Conversor HDMI para RCA",
    categoria: "Conversores",
    meuPreco: 45.90,
    precoMercado: {
      min: 35.00,
      max: 65.00,
      media: 48.00
    },
    vendidosMes: 89,
    status: "competitivo",
    oportunidadeImportacao: {
      viavel: true,
      precoCIF: 8.50,
      margemPotencial: 72,
      demandaEstimada: "Média"
    }
  },
  {
    id: 3,
    nome: "Cabo HDMI 2.0 - 3 metros",
    categoria: "Cabos",
    meuPreco: 35.00,
    precoMercado: {
      min: 25.00,
      max: 45.00,
      media: 32.00
    },
    vendidosMes: 234,
    status: "caro",
    oportunidadeImportacao: {
      viavel: true,
      precoCIF: 3.20,
      margemPotencial: 85,
      demandaEstimada: "Muito Alta"
    }
  },
  {
    id: 4,
    nome: "Suporte TV LCD 32-55 polegadas",
    categoria: "Acabamentos",
    meuPreco: 79.90,
    precoMercado: {
      min: 85.00,
      max: 150.00,
      media: 110.00
    },
    vendidosMes: 67,
    status: "barato",
    oportunidadeImportacao: {
      viavel: false,
      precoCIF: 18.00,
      margemPotencial: 45,
      demandaEstimada: "Média"
    }
  },
  {
    id: 5,
    nome: "Repetidor WiFi 300Mbps",
    categoria: "Internet e Redes",
    meuPreco: 55.00,
    precoMercado: {
      min: 45.00,
      max: 80.00,
      media: 60.00
    },
    vendidosMes: 123,
    status: "competitivo",
    oportunidadeImportacao: {
      viavel: true,
      precoCIF: 12.00,
      margemPotencial: 68,
      demandaEstimada: "Alta"
    }
  },
  {
    id: 6,
    nome: "Drone com Câmera HD",
    categoria: "Drones",
    meuPreco: 299.00,
    precoMercado: {
      min: 250.00,
      max: 450.00,
      media: 320.00
    },
    vendidosMes: 34,
    status: "competitivo",
    oportunidadeImportacao: {
      viavel: true,
      precoCIF: 85.00,
      margemPotencial: 55,
      demandaEstimada: "Média"
    }
  }
];

// Produtos com alta oportunidade de importação
const oportunidadesImportacao = produtosComparacao
  .filter(p => p.oportunidadeImportacao.viavel && p.oportunidadeImportacao.margemPotencial > 60)
  .sort((a, b) => b.oportunidadeImportacao.margemPotencial - a.oportunidadeImportacao.margemPotencial);

export default function InteligenciaMercado() {
  const [busca, setBusca] = useState("");
  const [, setLocation] = useLocation();

  const handleCalcularImportacao = (produto: typeof produtosComparacao[0]) => {
    // Redireciona para página de importação com dados do produto
    setLocation('/importacao');
    // Aqui poderia passar dados via state/context se necessário
  };

  const getStatusBadge = (status: string) => {
    const config = {
      barato: { variant: "default" as const, label: "Abaixo do Mercado", icon: <ArrowDownRight className="w-3 h-3" /> },
      competitivo: { variant: "secondary" as const, label: "Competitivo", icon: <Minus className="w-3 h-3" /> },
      caro: { variant: "destructive" as const, label: "Acima do Mercado", icon: <ArrowUpRight className="w-3 h-3" /> }
    };
    return config[status as keyof typeof config];
  };

  const getDemandaBadge = (demanda: string) => {
    const config = {
      "Muito Alta": "bg-green-500 text-white",
      "Alta": "bg-blue-500 text-white",
      "Média": "bg-yellow-500 text-white",
      "Baixa": "bg-gray-500 text-white"
    };
    return config[demanda as keyof typeof config] || config["Média"];
  };

  const produtosFiltrados = produtosComparacao.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Target className="w-8 h-8" />
          Inteligência de Mercado
        </h1>
        <p className="text-muted-foreground">Análise de preços, competitividade e oportunidades de importação</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Produtos Analisados</p>
                <p className="text-2xl font-bold">{produtosComparacao.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Competitivos</p>
                <p className="text-2xl font-bold text-green-600">
                  {produtosComparacao.filter(p => p.status === "competitivo").length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Acima do Mercado</p>
                <p className="text-2xl font-bold text-red-600">
                  {produtosComparacao.filter(p => p.status === "caro").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Oportunidades</p>
                <p className="text-2xl font-bold text-purple-600">
                  {oportunidadesImportacao.length}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Oportunidades de Importação */}
      <Card className="border-2 border-purple-500 bg-purple-50 dark:bg-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Sparkles className="w-5 h-5" />
            Oportunidades de Importação - Alto Lucro
          </CardTitle>
          <CardDescription>
            Produtos com margem potencial acima de 60% - ideais para importação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {oportunidadesImportacao.map((produto) => (
              <div key={produto.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-purple-300">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold">{produto.nome}</h3>
                    <p className="text-xs text-muted-foreground">{produto.categoria}</p>
                  </div>
                  <Badge className={getDemandaBadge(produto.oportunidadeImportacao.demandaEstimada)}>
                    {produto.oportunidadeImportacao.demandaEstimada}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Preço CIF (USD)</p>
                    <p className="font-bold text-blue-600">
                      ${produto.oportunidadeImportacao.precoCIF.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preço Mercado (BR)</p>
                    <p className="font-bold">
                      R$ {produto.precoMercado.media.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Margem Potencial</p>
                    <p className="font-bold text-green-600">
                      {produto.oportunidadeImportacao.margemPotencial}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vendas/Mês</p>
                    <p className="font-bold">
                      {produto.vendidosMes} un
                    </p>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => handleCalcularImportacao(produto)}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Calcular Importação
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {/* Tabela de Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Preços - Mercado</CardTitle>
          <CardDescription>Análise detalhada de competitividade dos seus produtos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold">Produto</th>
                  <th className="text-left p-3 text-sm font-semibold">Categoria</th>
                  <th className="text-right p-3 text-sm font-semibold">Meu Preço</th>
                  <th className="text-right p-3 text-sm font-semibold">Mercado (Média)</th>
                  <th className="text-right p-3 text-sm font-semibold">Diferença</th>
                  <th className="text-center p-3 text-sm font-semibold">Status</th>
                  <th className="text-right p-3 text-sm font-semibold">Vendas/Mês</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((produto) => {
                  const diferenca = ((produto.meuPreco - produto.precoMercado.media) / produto.precoMercado.media) * 100;
                  const statusBadge = getStatusBadge(produto.status);

                  return (
                    <tr key={produto.id} className="border-b hover:bg-accent">
                      <td className="p-3">
                        <p className="font-medium">{produto.nome}</p>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{produto.categoria}</td>
                      <td className="p-3 text-right font-bold">
                        R$ {produto.meuPreco.toFixed(2)}
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
                        <Badge {...statusBadge} className="flex items-center gap-1 justify-center">
                          {statusBadge.icon}
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium">{produto.vendidosMes}</td>
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
