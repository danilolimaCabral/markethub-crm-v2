import CRMLayout from "@/components/CRMLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Eye, XCircle, CheckCircle, AlertCircle, Search, Filter, RefreshCw, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface NotaFiscal {
  id: number;
  numero: string;
  serie: string;
  chave: string;
  cliente: string;
  cnpj_cpf: string;
  valor: number;
  data_emissao: string;
  status: 'Emitida' | 'Cancelada' | 'Denegada' | 'Pendente';
  pedido_id?: number;
}

export default function NotasFiscais() {
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Carregar notas fiscais da API
  const carregarNotasFiscais = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('markethub_token');
      const response = await fetch('/api/notas-fiscais', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        // API ainda não implementada
        setNotasFiscais([]);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao carregar notas fiscais');
      }

      const data = await response.json();
      setNotasFiscais(data.data || data || []);
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error);
      setNotasFiscais([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarNotasFiscais();
  }, []);

  // Filtrar notas
  const notasFiltradas = notasFiscais.filter(nf => {
    const matchBusca = busca === '' || 
      nf.numero.includes(busca) ||
      nf.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      nf.chave.includes(busca);
    
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Emitida': return 'default';
      case 'Cancelada': return 'destructive';
      case 'Denegada': return 'secondary';
      case 'Pendente': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Emitida': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelada': return <XCircle className="w-4 h-4" />;
      case 'Denegada': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Notas Fiscais
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestão de NF-e emitidas
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={carregarNotasFiscais} 
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-sm border-border">
            <CardContent className="p-5">
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
            <CardContent className="p-5">
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
            <CardContent className="p-5">
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
            <CardContent className="p-5">
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
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-bold text-primary">
                    {stats.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por número, cliente ou chave..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="todos">Todos os Status</option>
                <option value="Emitida">Emitidas</option>
                <option value="Cancelada">Canceladas</option>
                <option value="Denegada">Denegadas</option>
                <option value="Pendente">Pendentes</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Notas Fiscais */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-muted-foreground">Carregando notas fiscais...</p>
                </div>
              </div>
            ) : notasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma nota fiscal encontrada
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {notasFiscais.length === 0 
                    ? 'As notas fiscais serão exibidas aqui quando você integrar com um sistema de emissão de NF-e (ex: Bling, Omie, Tiny).'
                    : 'Tente ajustar os filtros de busca'}
                </p>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Integração Fiscal
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-foreground">Número</th>
                      <th className="text-left p-4 font-semibold text-foreground">Cliente</th>
                      <th className="text-left p-4 font-semibold text-foreground">CNPJ/CPF</th>
                      <th className="text-right p-4 font-semibold text-foreground">Valor</th>
                      <th className="text-center p-4 font-semibold text-foreground">Data</th>
                      <th className="text-center p-4 font-semibold text-foreground">Status</th>
                      <th className="text-center p-4 font-semibold text-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasFiltradas.map((nf) => (
                      <tr key={nf.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{nf.numero}</p>
                            <p className="text-xs text-muted-foreground">Série: {nf.serie}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-foreground">{nf.cliente}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-muted-foreground">{nf.cnpj_cpf}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-foreground">
                            {nf.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm text-muted-foreground">
                            {new Date(nf.data_emissao).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={getStatusColor(nf.status)} className="flex items-center gap-1 w-fit mx-auto">
                            {getStatusIcon(nf.status)}
                            {nf.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost" title="Visualizar NF-e">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Baixar XML">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informação sobre integração */}
        {notasFiscais.length === 0 && !loading && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Integração com Sistema Fiscal
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Para emitir e gerenciar notas fiscais, você precisa integrar o MarketHub CRM com um sistema de emissão de NF-e.
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    <strong>Sistemas suportados:</strong>
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1 mb-4">
                    <li>Bling - ERP completo com emissão de NF-e</li>
                    <li>Omie - Sistema de gestão empresarial</li>
                    <li>Tiny ERP - Gestão de vendas e estoque</li>
                    <li>NFe.io - API de emissão de notas fiscais</li>
                  </ul>
                  <Button variant="outline" className="bg-white dark:bg-slate-900">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar Integração
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CRMLayout>
  );
}
