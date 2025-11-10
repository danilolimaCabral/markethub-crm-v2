import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { toast } from 'sonner';

interface CustoFinanceiro {
  id: string;
  descricao: string;
  categoria: 'OPEX' | 'Custo Fixo' | 'Custo Variável';
  valor: number;
  recorrencia: 'mensal' | 'trimestral' | 'anual' | 'unico';
  data: string;
  observacoes?: string;
}

export default function PastaFinanceira() {
  const [custos, setCustos] = useState<CustoFinanceiro[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  
  // Form state
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: 'OPEX' as 'OPEX' | 'Custo Fixo' | 'Custo Variável',
    valor: '',
    recorrencia: 'mensal' as ('mensal' | 'trimestral' | 'anual' | 'unico'),
    observacoes: ''
  });

  useEffect(() => {
    carregarCustos();
  }, []);

  const carregarCustos = () => {
    const custosStr = localStorage.getItem('markethub_custos_financeiros');
    if (custosStr) {
      setCustos(JSON.parse(custosStr));
    }
  };

  const salvarCusto = () => {
    if (!formData.descricao || !formData.valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const novoCusto: CustoFinanceiro = {
      id: `custo-${Date.now()}`,
      descricao: formData.descricao,
      categoria: formData.categoria,
      valor: parseFloat(formData.valor),
      recorrencia: formData.recorrencia,
      data: new Date().toISOString(),
      observacoes: formData.observacoes
    };

    const novosCustos = [...custos, novoCusto];
    localStorage.setItem('markethub_custos_financeiros', JSON.stringify(novosCustos));
    setCustos(novosCustos);

    // Limpar form
    setFormData({
      descricao: '',
      categoria: 'OPEX',
      valor: '',
      recorrencia: 'mensal',
      observacoes: ''
    });

    setDialogOpen(false);
    toast.success('Custo adicionado com sucesso!');
  };

  const excluirCusto = (id: string) => {
    const novosCustos = custos.filter(c => c.id !== id);
    localStorage.setItem('markethub_custos_financeiros', JSON.stringify(novosCustos));
    setCustos(novosCustos);
    toast.success('Custo excluído');
  };

  const custosFiltrados = filtroCategoria === 'todas' 
    ? custos 
    : custos.filter(c => c.categoria === filtroCategoria);

  const totalPorCategoria = (categoria: string) => {
    return custos
      .filter(c => categoria === 'todas' || c.categoria === categoria)
      .reduce((sum, c) => sum + c.valor, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pasta Financeira</h1>
            <p className="text-muted-foreground">Gestão de OPEX, Custos Fixos e Variáveis</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Custo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Custo</DialogTitle>
                <DialogDescription>
                  Registre um novo custo operacional, fixo ou variável
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Descrição *</Label>
                  <Input
                    placeholder="Ex: Aluguel, Energia, Comissões..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value: any) => setFormData({...formData, categoria: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEX">OPEX (Despesas Operacionais)</SelectItem>
                      <SelectItem value="Custo Fixo">Custo Fixo</SelectItem>
                      <SelectItem value="Custo Variável">Custo Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Valor (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Recorrência</Label>
                  <Select
                    value={formData.recorrencia}
                    onValueChange={(value: any) => setFormData({...formData, recorrencia: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="unico">Único</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Input
                    placeholder="Informações adicionais..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  />
                </div>

                <Button onClick={salvarCusto} className="w-full">
                  Salvar Custo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPorCategoria('todas'))}</div>
              <p className="text-xs text-muted-foreground">Todos os custos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OPEX</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {formatCurrency(totalPorCategoria('OPEX'))}
              </div>
              <p className="text-xs text-muted-foreground">Despesas operacionais</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custos Fixos</CardTitle>
              <PieChart className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                {formatCurrency(totalPorCategoria('Custo Fixo'))}
              </div>
              <p className="text-xs text-muted-foreground">Independem do volume</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custos Variáveis</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {formatCurrency(totalPorCategoria('Custo Variável'))}
              </div>
              <p className="text-xs text-muted-foreground">Variam com vendas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                <SelectItem value="OPEX">OPEX</SelectItem>
                <SelectItem value="Custo Fixo">Custo Fixo</SelectItem>
                <SelectItem value="Custo Variável">Custo Variável</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tabela de Custos */}
        <Card>
          <CardHeader>
            <CardTitle>Custos Registrados</CardTitle>
            <CardDescription>
              {custosFiltrados.length} custo(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {custosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum custo registrado ainda
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Recorrência</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custosFiltrados.map((custo) => (
                    <TableRow key={custo.id}>
                      <TableCell className="font-medium">{custo.descricao}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          custo.categoria === 'OPEX' ? 'bg-blue-100 text-blue-700' :
                          custo.categoria === 'Custo Fixo' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {custo.categoria}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold">{formatCurrency(custo.valor)}</TableCell>
                      <TableCell className="capitalize">{custo.recorrencia}</TableCell>
                      <TableCell>{new Date(custo.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-muted-foreground">{custo.observacoes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => excluirCusto(custo.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Explicação das Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Entenda as Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-blue-600 mb-1">OPEX (Operational Expenditure)</h3>
              <p className="text-sm text-muted-foreground">
                Despesas operacionais do dia a dia: salários, marketing, software, serviços, manutenção, etc.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-purple-600 mb-1">Custos Fixos</h3>
              <p className="text-sm text-muted-foreground">
                Custos que não variam com o volume de vendas: aluguel, seguros, licenças, assinaturas fixas, etc.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-orange-600 mb-1">Custos Variáveis</h3>
              <p className="text-sm text-muted-foreground">
                Custos que variam proporcionalmente às vendas: comissões de marketplaces, frete, embalagens, taxas de pagamento, etc.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
