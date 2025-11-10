import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, Moon, Sun, Search, RefreshCw, Package, ShoppingCart, Store, Users, Loader2, BarChart3 } from "lucide-react";
import ChartMessage from "@/components/ChartMessage";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function API() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pedidos");
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string, chart?: {type: 'bar' | 'pie' | 'line', data: any[], title?: string, dataKey?: string, nameKey?: string}}>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Dados simulados - em produção viriam da API real
  const [pedidos, setPedidos] = useState([
    { id: "PED-001", cliente: "João Silva", valor: 450.00, status: "pendente", data: "04/11/2025", marketplace: "Mercado Livre" },
    { id: "PED-002", cliente: "Maria Santos", valor: 320.00, status: "enviado", data: "04/11/2025", marketplace: "Amazon" },
    { id: "PED-003", cliente: "Pedro Costa", valor: 180.00, status: "entregue", data: "03/11/2025", marketplace: "Shopee" },
  ]);

  const [produtos, setProdutos] = useState([
    { id: "PROD-001", nome: "Produto A", sku: "SKU-001", estoque: 50, preco: 149.90, status: "ativo" },
    { id: "PROD-002", nome: "Produto B", sku: "SKU-002", estoque: 3, preco: 89.90, status: "ativo" },
    { id: "PROD-003", nome: "Produto C", sku: "SKU-003", estoque: 0, preco: 199.90, status: "inativo" },
  ]);

  const [anuncios, setAnuncios] = useState([
    { id: "ANU-001", produto: "Produto A", marketplace: "Mercado Livre", preco: 149.90, status: "ativo", visualizacoes: 1234 },
    { id: "ANU-002", produto: "Produto B", marketplace: "Amazon", preco: 89.90, status: "ativo", visualizacoes: 987 },
    { id: "ANU-003", produto: "Produto C", marketplace: "Shopee", preco: 199.90, status: "pausado", visualizacoes: 0 },
  ]);

  const handleConsultarAPI = async () => {
    setLoading(true);
    toast.info("Consultando API do MarketHub CRM...");
    
    // Simulação de chamada à API
    setTimeout(() => {
      setLoading(false);
      toast.success("Dados atualizados com sucesso!");
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      enviado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      entregue: "bg-green-500/10 text-green-500 border-green-500/20",
      ativo: "bg-green-500/10 text-green-500 border-green-500/20",
      inativo: "bg-red-500/10 text-red-500 border-red-500/20",
      pausado: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Consultar API</h1>
              <p className="text-xs text-muted-foreground">Dados do MarketHub CRM em tempo real</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Controles */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar por ID, nome, cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="pausado">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleConsultarAPI} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Consultando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs com dados */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pedidos" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Pedidos
              </TabsTrigger>
              <TabsTrigger value="produtos" className="gap-2">
                <Package className="w-4 h-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="anuncios" className="gap-2">
                <Store className="w-4 h-4" />
                Anúncios
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2">
                <Users className="w-4 h-4" />
                Chat
              </TabsTrigger>
            </TabsList>

            {/* Tab Pedidos */}
            <TabsContent value="pedidos">
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos</CardTitle>
                  <CardDescription>Lista de pedidos do MarketHub CRM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Marketplace</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pedidos.map((pedido) => (
                          <TableRow key={pedido.id}>
                            <TableCell className="font-mono text-sm">{pedido.id}</TableCell>
                            <TableCell>{pedido.cliente}</TableCell>
                            <TableCell>{pedido.marketplace}</TableCell>
                            <TableCell>R$ {pedido.valor.toFixed(2)}</TableCell>
                            <TableCell>{pedido.data}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(pedido.status)}`}>
                                {pedido.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Produtos */}
            <TabsContent value="produtos">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos</CardTitle>
                  <CardDescription>Catálogo de produtos e estoque</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Estoque</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produtos.map((produto) => (
                          <TableRow key={produto.id}>
                            <TableCell className="font-mono text-sm">{produto.id}</TableCell>
                            <TableCell>{produto.nome}</TableCell>
                            <TableCell className="font-mono text-sm">{produto.sku}</TableCell>
                            <TableCell>
                              <span className={produto.estoque < 10 ? "text-red-500 font-semibold" : ""}>
                                {produto.estoque} un
                              </span>
                            </TableCell>
                            <TableCell>R$ {produto.preco.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(produto.status)}`}>
                                {produto.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Anúncios */}
            <TabsContent value="anuncios">
              <Card>
                <CardHeader>
                  <CardTitle>Anúncios</CardTitle>
                  <CardDescription>Anúncios ativos nos marketplaces</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Marketplace</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Visualizações</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {anuncios.map((anuncio) => (
                          <TableRow key={anuncio.id}>
                            <TableCell className="font-mono text-sm">{anuncio.id}</TableCell>
                            <TableCell>{anuncio.produto}</TableCell>
                            <TableCell>{anuncio.marketplace}</TableCell>
                            <TableCell>R$ {anuncio.preco.toFixed(2)}</TableCell>
                            <TableCell>{anuncio.visualizacoes.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(anuncio.status)}`}>
                                {anuncio.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Chat */}
            <TabsContent value="chat">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle>Chat com MarketHub CRM</CardTitle>
                  <CardDescription>Converse e obtenha informações em tempo real</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {/* Área de mensagens */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/30 rounded-lg">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Users className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Bem-vindo ao Chat!</p>
                        <p className="text-sm mt-2 max-w-md">
                          Pergunte sobre pedidos, produtos, estoque, anúncios ou qualquer informação do MarketHub CRM.
                        </p>
                        <div className="mt-6 space-y-2 text-left">
                          <p className="text-sm font-medium">Exemplos:</p>
                          <div className="space-y-1 text-sm">
                            <p>• "Quantos pedidos pendentes tenho?"</p>
                            <p>• "Quais produtos estão com estoque baixo?"</p>
                            <p>• "Mostre os anúncios ativos"</p>
                            <p>• "Mostre gráfico de vendas por marketplace"</p>
                            <p>• "Gráfico de estoque dos produtos"</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted border'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.chart && (
                              <ChartMessage
                                type={msg.chart.type}
                                data={msg.chart.data}
                                title={msg.chart.title}
                                dataKey={msg.chart.dataKey}
                                nameKey={msg.chart.nameKey}
                                onDrillDown={(item) => handleDrillDown(item, msg.chart!)}
                              />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted border rounded-lg px-4 py-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input de mensagem */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua pergunta..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !chatLoading && inputMessage.trim()) {
                          handleSendMessage();
                        }
                      }}
                      disabled={chatLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={chatLoading || !inputMessage.trim()}
                    >
                      {chatLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Enviar"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );

  async function handleSendMessage() {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Adiciona mensagem do usuário
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    // Simula processamento e resposta
    setTimeout(() => {
      const response = generateResponse(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setChatLoading(false);
    }, 1500);
  }

  function handleDrillDown(item: any, chart: any) {
    // Dados detalhados por marketplace
    const drillDownDetails: Record<string, any> = {
      'Mercado Livre': {
        data: [
          { name: 'Eletrônicos', value: 200 },
          { name: 'Casa', value: 150 },
          { name: 'Moda', value: 100 }
        ],
        title: 'Mercado Livre - Detalhes por Categoria'
      },
      'Amazon': {
        data: [
          { name: 'Eletrônicos', value: 180 },
          { name: 'Livros', value: 90 },
          { name: 'Casa', value: 50 }
        ],
        title: 'Amazon - Detalhes por Categoria'
      },
      'Shopee': {
        data: [
          { name: 'Moda', value: 100 },
          { name: 'Beleza', value: 50 },
          { name: 'Acessórios', value: 30 }
        ],
        title: 'Shopee - Detalhes por Categoria'
      },
      'Produto A': {
        data: [
          { name: 'Mercado Livre', value: 25 },
          { name: 'Amazon', value: 15 },
          { name: 'Shopee', value: 10 }
        ],
        title: 'Produto A - Distribuição por Marketplace'
      },
      'Produto B': {
        data: [
          { name: 'Mercado Livre', value: 1 },
          { name: 'Amazon', value: 1 },
          { name: 'Shopee', value: 1 }
        ],
        title: 'Produto B - Distribuição por Marketplace'
      },
      'Produto C': {
        data: [
          { name: 'Mercado Livre', value: 0 },
          { name: 'Amazon', value: 0 },
          { name: 'Shopee', value: 0 }
        ],
        title: 'Produto C - Sem Estoque em Nenhum Marketplace'
      }
    };

    const itemName = item.name || item[chart.nameKey || 'name'];
    return drillDownDetails[itemName] || null;
  }

  function generateResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Gráficos
    if (lowerMessage.includes('gráfico') || lowerMessage.includes('grafico')) {
      if (lowerMessage.includes('venda') || lowerMessage.includes('marketplace')) {
        const chartData = [
          { name: 'Mercado Livre', value: 450 },
          { name: 'Amazon', value: 320 },
          { name: 'Shopee', value: 180 }
        ];
        setMessages(prev => [
          ...prev.slice(0, -1),
          prev[prev.length - 1],
          { 
            role: 'assistant', 
            content: '📊 Gráfico de vendas por marketplace:',
            chart: {
              type: 'bar',
              data: chartData,
              title: 'Vendas por Marketplace (R$)',
              dataKey: 'value',
              nameKey: 'name'
            }
          }
        ]);
        return '';
      }
      
      if (lowerMessage.includes('estoque') || lowerMessage.includes('produto')) {
        const chartData = [
          { name: 'Produto A', value: 50 },
          { name: 'Produto B', value: 3 },
          { name: 'Produto C', value: 0 }
        ];
        setMessages(prev => [
          ...prev.slice(0, -1),
          prev[prev.length - 1],
          { 
            role: 'assistant', 
            content: '📊 Gráfico de estoque por produto:',
            chart: {
              type: 'bar',
              data: chartData,
              title: 'Estoque Atual (unidades)',
              dataKey: 'value',
              nameKey: 'name'
            }
          }
        ]);
        return '';
      }
      
      if (lowerMessage.includes('distribuição') || lowerMessage.includes('pizza')) {
        const chartData = [
          { name: 'Mercado Livre', value: 450 },
          { name: 'Amazon', value: 320 },
          { name: 'Shopee', value: 180 }
        ];
        setMessages(prev => [
          ...prev.slice(0, -1),
          prev[prev.length - 1],
          { 
            role: 'assistant', 
            content: '📊 Distribuição de vendas:',
            chart: {
              type: 'pie',
              data: chartData,
              title: 'Distribuição por Marketplace',
              dataKey: 'value',
              nameKey: 'name'
            }
          }
        ]);
        return '';
      }
    }

    // Pedidos
    if (lowerMessage.includes('pedido') && lowerMessage.includes('pendente')) {
      return `📦 Você tem **3 pedidos pendentes**:\n\n` +
        `1. PED-001 - João Silva - R$ 450,00 (Mercado Livre)\n` +
        `2. PED-002 - Maria Santos - R$ 320,00 (Amazon)\n` +
        `3. PED-003 - Pedro Costa - R$ 180,00 (Shopee)\n\n` +
        `Total: R$ 950,00`;
    }

    if (lowerMessage.includes('pedido')) {
      return `📦 Informações sobre pedidos:\n\n` +
        `• Total de pedidos: 3\n` +
        `• Pendentes: 1\n` +
        `• Enviados: 1\n` +
        `• Entregues: 1\n` +
        `• Valor total: R$ 950,00`;
    }

    // Estoque
    if (lowerMessage.includes('estoque') && (lowerMessage.includes('baixo') || lowerMessage.includes('pouco'))) {
      return `⚠️ **Produtos com estoque baixo:**\n\n` +
        `• Produto B (SKU-002): 3 unidades\n` +
        `• Produto C (SKU-003): 0 unidades (sem estoque!)\n\n` +
        `Recomendo reabastecer esses produtos.`;
    }

    if (lowerMessage.includes('estoque') || lowerMessage.includes('produto')) {
      return `📦 Resumo de estoque:\n\n` +
        `• Produto A: 50 unidades - R$ 149,90\n` +
        `• Produto B: 3 unidades ⚠️ - R$ 89,90\n` +
        `• Produto C: 0 unidades ❌ - R$ 199,90\n\n` +
        `Total de produtos: 3\n` +
        `Produtos ativos: 2`;
    }

    // Anúncios
    if (lowerMessage.includes('anuncio') || lowerMessage.includes('anúncio')) {
      return `📢 Status dos anúncios:\n\n` +
        `• ANU-001 (Produto A): Ativo no Mercado Livre - 1.234 visualizações\n` +
        `• ANU-002 (Produto B): Ativo na Amazon - 987 visualizações\n` +
        `• ANU-003 (Produto C): Pausado na Shopee - 0 visualizações\n\n` +
        `Total de anúncios: 3 (2 ativos, 1 pausado)`;
    }

    // Vendas
    if (lowerMessage.includes('venda') || lowerMessage.includes('faturamento')) {
      return `💰 Resumo de vendas:\n\n` +
        `• Faturamento total: R$ 950,00\n` +
        `• Ticket médio: R$ 316,67\n` +
        `• Marketplace com mais vendas: Mercado Livre\n` +
        `• Período: Últimos 7 dias`;
    }

    // Resposta padrão
    return `Entendi sua pergunta sobre "${message}".\n\n` +
      `Posso ajudar com informações sobre:\n` +
      `• Pedidos (pendentes, enviados, entregues)\n` +
      `• Produtos e estoque\n` +
      `• Anúncios nos marketplaces\n` +
      `• Vendas e faturamento\n\n` +
      `Tente perguntar de forma mais específica!`;
  }
}
