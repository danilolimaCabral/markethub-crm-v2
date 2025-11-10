import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  X, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Users,
  DollarSign,
  Package,
  Target
} from "lucide-react";

// Gerar sugestões baseadas nos dados do CRM
const gerarSugestoes = () => {
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  return [
    {
      id: 1,
      tipo: "Reunião Financeira",
      urgencia: "alta",
      icon: <DollarSign className="w-5 h-5" />,
      titulo: "Reunião Urgente: Contas Vencidas",
      descricao: "5 contas vencidas totalizando R$ 42.334,00 precisam de atenção imediata",
      pauta: [
        "Analisar contas vencidas e priorizar pagamentos",
        "Negociar prazos com fornecedores",
        "Revisar fluxo de caixa projetado (-R$ 127.632)",
        "Definir estratégia de captação de recursos"
      ],
      participantes: ["Diretor Financeiro", "Controller", "Gerente Comercial"],
      dataSugerida: "Hoje, 15:00",
      cor: "border-red-500 bg-red-50 dark:bg-red-950"
    },
    {
      id: 2,
      tipo: "Reunião Comercial",
      urgencia: "alta",
      icon: <TrendingUp className="w-5 h-5" />,
      titulo: "Estratégia para Aumentar Vendas",
      descricao: "Análise de oportunidades baseada em 340 pedidos pendentes e R$ 379.979 em faturamento",
      pauta: [
        "Analisar produtos mais vendidos (Antenas: 43,7%)",
        "Explorar categorias com baixa performance",
        "Estratégias de cross-sell e up-sell",
        "Campanhas promocionais para Mercado Livre (99,9% das vendas)",
        "Diversificação de canais de venda"
      ],
      participantes: ["Gerente Comercial", "Marketing", "Vendas"],
      dataSugerida: "Amanhã, 10:00",
      cor: "border-orange-500 bg-orange-50 dark:bg-orange-950"
    },
    {
      id: 3,
      tipo: "Reunião Operacional",
      urgencia: "media",
      icon: <Package className="w-5 h-5" />,
      titulo: "Otimização de Processos",
      descricao: "340 pedidos pendentes com taxa de conferência de 70,7% - há espaço para melhoria",
      pauta: [
        "Analisar gargalos no processo de conferência",
        "Meta: aumentar taxa de conferência para 85%",
        "Implementar checklist de qualidade",
        "Treinamento da equipe de separação",
        "Automatização de processos repetitivos"
      ],
      participantes: ["Gerente de Operações", "Logística", "Qualidade"],
      dataSugerida: "Sexta-feira, 14:00",
      cor: "border-blue-500 bg-blue-50 dark:bg-blue-950"
    },
    {
      id: 4,
      tipo: "Reunião de Importação",
      urgencia: "media",
      icon: <Target className="w-5 h-5" />,
      titulo: "Análise de Viabilidade de Importação",
      descricao: "Oportunidade de reduzir custos com importação direta",
      pauta: [
        "Avaliar produtos com maior margem para importação",
        "Analisar fornecedores internacionais",
        "Calcular custos de importação (tributos + despesas)",
        "Definir margem de lucro competitiva",
        "Planejar primeira operação de importação"
      ],
      participantes: ["Diretor Comercial", "Compras", "Financeiro"],
      dataSugerida: "Próxima semana",
      cor: "border-purple-500 bg-purple-50 dark:bg-purple-950"
    },
    {
      id: 5,
      tipo: "Reunião Estratégica",
      urgencia: "baixa",
      icon: <Lightbulb className="w-5 h-5" />,
      titulo: "Planejamento de Crescimento",
      descricao: "Definir metas e estratégias para o próximo trimestre",
      pauta: [
        "Análise de performance atual (R$ 379.979/mês)",
        "Definir meta de faturamento para próximo trimestre",
        "Investimentos necessários (estoque, marketing, equipe)",
        "Expansão de categorias de produtos",
        "Melhorias no atendimento pós-venda"
      ],
      participantes: ["Diretoria", "Gerentes", "Coordenadores"],
      dataSugerida: "Próxima semana",
      cor: "border-green-500 bg-green-50 dark:bg-green-950"
    }
  ];
};

const dicasVendas = [
  {
    titulo: "Foque nas Antenas",
    descricao: "43,7% das suas vendas vêm de antenas. Expanda essa categoria com novos modelos e acessórios.",
    impacto: "Alto"
  },
  {
    titulo: "Diversifique Canais",
    descricao: "99,9% das vendas estão no Mercado Livre. Explore Shopee, Amazon e loja própria.",
    impacto: "Alto"
  },
  {
    titulo: "Melhore a Taxa de Conferência",
    descricao: "Aumentar de 70,7% para 85% reduz devoluções e aumenta satisfação do cliente.",
    impacto: "Médio"
  },
  {
    titulo: "Cross-Sell Inteligente",
    descricao: "Ofereça cabos e conversores junto com antenas - produtos complementares.",
    impacto: "Médio"
  }
];

export default function AssistenteIAFloat() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reunioes" | "dicas">("reunioes");
  const sugestoes = gerarSugestoes();

  const getUrgenciaBadge = (urgencia: string) => {
    const config = {
      alta: { variant: "destructive" as const, label: "Urgente" },
      media: { variant: "default" as const, label: "Moderada" },
      baixa: { variant: "secondary" as const, label: "Baixa" }
    };
    return config[urgencia as keyof typeof config] || config.baixa;
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-r from-purple-600 to-blue-600
          text-white shadow-lg hover:shadow-xl
          transition-all duration-300 hover:scale-110
          flex items-center justify-center
          ${open ? 'rotate-180' : ''}
        `}
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 animate-pulse" />}
      </button>

      {/* Painel de Sugestões */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[500px] max-w-[calc(100vw-3rem)] max-h-[600px] overflow-hidden">
          <Card className="shadow-2xl border-2 border-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Assistente IA - Sugestões Inteligentes
              </CardTitle>
              <CardDescription className="text-purple-100">
                Baseado nos dados reais do seu CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("reunioes")}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    activeTab === "reunioes"
                      ? "bg-purple-50 dark:bg-purple-950 text-purple-600 border-b-2 border-purple-600"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Reuniões Sugeridas
                </button>
                <button
                  onClick={() => setActiveTab("dicas")}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    activeTab === "dicas"
                      ? "bg-purple-50 dark:bg-purple-950 text-purple-600 border-b-2 border-purple-600"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Lightbulb className="w-4 h-4 inline mr-2" />
                  Dicas de Vendas
                </button>
              </div>

              {/* Conteúdo */}
              <div className="overflow-y-auto max-h-[450px] p-4 space-y-3">
                {activeTab === "reunioes" ? (
                  // Lista de Reuniões Sugeridas
                  sugestoes.map((sugestao) => (
                    <Card key={sugestao.id} className={`${sugestao.cor} border-2`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {sugestao.icon}
                            <h3 className="font-bold text-sm">{sugestao.titulo}</h3>
                          </div>
                          <Badge {...getUrgenciaBadge(sugestao.urgencia)}>
                            {getUrgenciaBadge(sugestao.urgencia).label}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3">
                          {sugestao.descricao}
                        </p>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold mb-1">Pauta Sugerida:</p>
                            <ul className="text-xs space-y-1">
                              {sugestao.pauta.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-purple-600">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <Users className="w-3 h-3" />
                            <span className="text-muted-foreground">
                              {sugestao.participantes.join(", ")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-3 h-3" />
                            <span className="font-medium">{sugestao.dataSugerida}</span>
                          </div>

                          <Button size="sm" className="w-full mt-2">
                            Agendar Reunião
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  // Dicas de Vendas
                  <div className="space-y-3">
                    {dicasVendas.map((dica, idx) => (
                      <Card key={idx} className="border-2 border-green-500 bg-green-50 dark:bg-green-950">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              {dica.titulo}
                            </h3>
                            <Badge variant={dica.impacto === "Alto" ? "default" : "secondary"}>
                              Impacto {dica.impacto}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{dica.descricao}</p>
                        </CardContent>
                      </Card>
                    ))}

                    <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
                      <CardContent className="p-4">
                        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-blue-600" />
                          Atenção ao Fluxo de Caixa
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Saldo projetado negativo em -R$ 127.632. Priorize recebimentos e negocie prazos de pagamento.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
