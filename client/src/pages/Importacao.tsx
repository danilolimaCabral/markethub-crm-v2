import CRMLayout from "@/components/CRMLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  DollarSign,
  Percent,
  Plus,
  Trash2,
  TrendingUp,
  Package,
  Truck,
  Award,
  Megaphone,
  Box,
  CreditCard,
  Calculator,
  Save,
  FileText
} from "lucide-react";
import { toast } from "sonner";

interface CustoVariavel {
  id: string;
  categoria: string;
  nome: string;
  tipo: 'percentual' | 'fixo';
  valor: number;
  observacao?: string;
}

const CATEGORIAS = [
  { id: 'impostos', nome: 'Impostos sobre Vendas', icon: DollarSign, color: 'text-red-500', exemplos: 'ICMS, ISS, taxas Shopee/ML' },
  { id: 'fretes', nome: 'Fretes e Envios', icon: Truck, color: 'text-blue-500', exemplos: 'Logística, Correios, transportadoras' },
  { id: 'comissao', nome: 'Comissão e Premiação', icon: Award, color: 'text-yellow-500', exemplos: 'Percentual por meta ou canal' },
  { id: 'midia', nome: 'Mídia Variável', icon: Megaphone, color: 'text-purple-500', exemplos: 'Anúncios ML, Shopee Ads, Meta Ads' },
  { id: 'embalagens', nome: 'Embalagens e Insumos', icon: Box, color: 'text-green-500', exemplos: 'Caixas, fitas, etiquetas' },
  { id: 'taxas', nome: 'Taxas Financeiras', icon: CreditCard, color: 'text-orange-500', exemplos: 'Mercado Pago, cartões, boletos' },
];

export default function Importacao() {
  const [custos, setCustos] = useState<CustoVariavel[]>([]);
  const [categoriaAtual, setCategoriaAtual] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'percentual' | 'fixo'>('percentual');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [valorVenda, setValorVenda] = useState('1000');

  // Carregar custos do localStorage
  useEffect(() => {
    const custosStr = localStorage.getItem('custos_variaveis');
    if (custosStr) {
      try {
        setCustos(JSON.parse(custosStr));
      } catch (e) {
        console.error('Erro ao carregar custos:', e);
      }
    }
  }, []);

  // Salvar custos no localStorage
  const salvarCustos = (novosCustos: CustoVariavel[]) => {
    setCustos(novosCustos);
    localStorage.setItem('custos_variaveis', JSON.stringify(novosCustos));
  };

  const adicionarCusto = () => {
    if (!categoriaAtual || !nome || !valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const novoCusto: CustoVariavel = {
      id: Date.now().toString(),
      categoria: categoriaAtual,
      nome,
      tipo,
      valor: parseFloat(valor),
      observacao
    };

    salvarCustos([...custos, novoCusto]);
    toast.success('Custo adicionado com sucesso!');
    
    // Limpar formulário
    setNome('');
    setValor('');
    setObservacao('');
  };

  const removerCusto = (id: string) => {
    salvarCustos(custos.filter(c => c.id !== id));
    toast.success('Custo removido');
  };

  // Calcular PAX total
  const calcularPAX = () => {
    const vendaNum = parseFloat(valorVenda) || 0;
    let totalPercentual = 0;
    let totalFixo = 0;

    custos.forEach(custo => {
      if (custo.tipo === 'percentual') {
        totalPercentual += (vendaNum * custo.valor / 100);
      } else {
        totalFixo += custo.valor;
      }
    });

    return {
      totalPercentual,
      totalFixo,
      total: totalPercentual + totalFixo,
      percentualTotal: vendaNum > 0 ? ((totalPercentual + totalFixo) / vendaNum * 100) : 0
    };
  };

  const pax = calcularPAX();
  const lucroLiquido = parseFloat(valorVenda) - pax.total;
  const margemLiquida = parseFloat(valorVenda) > 0 ? (lucroLiquido / parseFloat(valorVenda) * 100) : 0;

  const custosPorCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    custos: custos.filter(c => c.categoria === cat.id)
  }));

  return (
    <CRMLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Gestão de Custos Variáveis (PAX)
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Cadastre e gerencie custos que variam conforme o volume de vendas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Cadastro */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Novo Custo
            </h2>

            <div className="space-y-4">
              <div>
                <Label>Categoria *</Label>
                <Select value={categoriaAtual} onValueChange={setCategoriaAtual}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${cat.color}`} />
                            {cat.nome}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {categoriaAtual && (
                  <p className="text-sm text-slate-500 mt-1">
                    Exemplos: {CATEGORIAS.find(c => c.id === categoriaAtual)?.exemplos}
                  </p>
                )}
              </div>

              <div>
                <Label>Nome do Custo *</Label>
                <Input
                  placeholder="Ex: Taxa Mercado Livre"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo *</Label>
                  <Select value={tipo} onValueChange={(v: 'percentual' | 'fixo') => setTipo(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4" />
                          Percentual
                        </div>
                      </SelectItem>
                      <SelectItem value="fixo">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Valor Fixo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Valor *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      {tipo === 'percentual' ? '%' : 'R$'}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={tipo === 'percentual' ? '0.00' : '0,00'}
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Observação (opcional)</Label>
                <Input
                  placeholder="Informações adicionais"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>

              <Button onClick={adicionarCusto} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Custo
              </Button>
            </div>
          </Card>

          {/* Calculadora de PAX */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Calculadora de PAX
            </h2>

            <div className="space-y-4">
              <div>
                <Label>Valor de Venda</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorVenda}
                    onChange={(e) => setValorVenda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Custos Percentuais:</span>
                  <span className="font-medium">R$ {pax.totalPercentual.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Custos Fixos:</span>
                  <span className="font-medium">R$ {pax.totalFixo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>PAX Total:</span>
                  <span className="text-red-600">R$ {pax.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">% sobre Venda:</span>
                  <span className="font-medium">{pax.percentualTotal.toFixed(2)}%</span>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-green-800 dark:text-green-200">Lucro Líquido:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    R$ {lucroLiquido.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-800 dark:text-green-200">Margem Líquida:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {margemLiquida.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de Custos por Categoria */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Custos Cadastrados
          </h2>

          {custosPorCategoria.map(categoria => {
            if (categoria.custos.length === 0) return null;
            
            const Icon = categoria.icon;
            const totalCategoria = categoria.custos.reduce((acc, c) => {
              if (c.tipo === 'percentual') {
                return acc + (parseFloat(valorVenda) * c.valor / 100);
              }
              return acc + c.valor;
            }, 0);

            return (
              <Card key={categoria.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${categoria.color}`} />
                    <div>
                      <h3 className="font-semibold text-lg">{categoria.nome}</h3>
                      <p className="text-sm text-slate-500">{categoria.exemplos}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    R$ {totalCategoria.toFixed(2)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {categoria.custos.map(custo => (
                    <div
                      key={custo.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{custo.nome}</div>
                        {custo.observacao && (
                          <div className="text-sm text-slate-500">{custo.observacao}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">
                            {custo.tipo === 'percentual' ? `${custo.valor}%` : `R$ ${custo.valor.toFixed(2)}`}
                          </div>
                          <div className="text-sm text-slate-500">
                            {custo.tipo === 'percentual' 
                              ? `R$ ${(parseFloat(valorVenda) * custo.valor / 100).toFixed(2)}`
                              : 'Fixo'
                            }
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerCusto(custo.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}

          {custos.length === 0 && (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                Nenhum custo cadastrado
              </h3>
              <p className="text-slate-500">
                Comece adicionando seus custos variáveis acima
              </p>
            </Card>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}
