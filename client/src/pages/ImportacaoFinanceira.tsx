import { useState, useRef } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { 
  Upload, 
  FileSpreadsheet, 
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Calendar,
  DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportHistory {
  id: string;
  fileName: string;
  date: string;
  recordsImported: number;
  status: 'success' | 'error' | 'partial';
}

interface FinancialRecord {
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  status: 'pago' | 'pendente' | 'atrasado';
}

export default function ImportacaoFinanceira() {
  const [isUploading, setIsUploading] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [previewData, setPreviewData] = useState<FinancialRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar histórico do localStorage
  useState(() => {
    const saved = localStorage.getItem('financial_import_history');
    if (saved) {
      setImportHistory(JSON.parse(saved));
    }
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      toast.error('Formato não suportado. Use Excel (.xlsx, .xls) ou CSV');
      return;
    }

    setIsUploading(true);
    toast.info('Processando arquivo...');

    try {
      if (fileExtension === 'csv') {
        await processCSV(file);
      } else {
        await processExcel(file);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processCSV = (file: File) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          processData(results.data as any[], file.name);
          resolve(null);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const processExcel = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    processData(jsonData as any[], file.name);
  };

  const processData = (data: any[], fileName: string) => {
    // Mapear colunas automaticamente
    const mapped: FinancialRecord[] = data.map((row: any) => {
      const tipoStr = (row.Tipo || row.tipo || row.TYPE || '').toLowerCase();
      const statusStr = (row.Status || row.status || row.STATUS || 'pendente').toLowerCase();
      
      return {
        data: row.Data || row.data || row.DATE || '',
        descricao: row.Descrição || row.Descricao || row.descricao || row.DESCRIPTION || '',
        categoria: row.Categoria || row.categoria || row.CATEGORY || 'Outros',
        valor: parseFloat(String(row.Valor || row.valor || row.VALUE || '0').replace(/[^\d,.-]/g, '').replace(',', '.')),
        tipo: (tipoStr.includes('receita') ? 'receita' : 'despesa') as 'receita' | 'despesa',
        status: (statusStr === 'pago' || statusStr === 'pendente' || statusStr === 'atrasado' ? statusStr : 'pendente') as 'pago' | 'pendente' | 'atrasado'
      };
    }).filter(record => record.data && record.valor);

    if (mapped.length === 0) {
      toast.error('Nenhum registro válido encontrado no arquivo');
      return;
    }

    setPreviewData(mapped);
    setShowPreview(true);
    toast.success(`${mapped.length} registros encontrados. Revise antes de importar.`);
  };

  const confirmImport = () => {
    // Salvar dados importados
    const existingData = JSON.parse(localStorage.getItem('financial_records') || '[]');
    const newData = [...existingData, ...previewData];
    localStorage.setItem('financial_records', JSON.stringify(newData));

    // Adicionar ao histórico
    const newHistory: ImportHistory = {
      id: Date.now().toString(),
      fileName: 'arquivo.xlsx',
      date: new Date().toLocaleString('pt-BR'),
      recordsImported: previewData.length,
      status: 'success'
    };

    const updatedHistory = [newHistory, ...importHistory];
    setImportHistory(updatedHistory);
    localStorage.setItem('financial_import_history', JSON.stringify(updatedHistory));

    setShowPreview(false);
    setPreviewData([]);
    toast.success(`${previewData.length} registros importados com sucesso!`);
  };

  const cancelImport = () => {
    setShowPreview(false);
    setPreviewData([]);
    toast.info('Importação cancelada');
  };

  const downloadTemplate = () => {
    // Criar template de exemplo
    const template = [
      {
        Data: '01/11/2025',
        Descrição: 'Venda Produto X',
        Categoria: 'Vendas',
        Valor: '1500.00',
        Tipo: 'Receita',
        Status: 'Pago'
      },
      {
        Data: '02/11/2025',
        Descrição: 'Fornecedor Y',
        Categoria: 'Compras',
        Valor: '850.50',
        Tipo: 'Despesa',
        Status: 'Pendente'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
    XLSX.writeFile(wb, 'template_financeiro.xlsx');
    
    toast.success('Template baixado com sucesso!');
  };

  const clearHistory = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      setImportHistory([]);
      localStorage.removeItem('financial_import_history');
      toast.success('Histórico limpo');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <CRMLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              Importação de Planilhas Financeiras
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Importe dados financeiros de Excel ou CSV e mantenha tudo atualizado
            </p>
          </div>
          
          <Button onClick={downloadTemplate} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Baixar Template
          </Button>
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Importar Arquivo</CardTitle>
            <CardDescription>
              Arraste um arquivo Excel (.xlsx, .xls) ou CSV, ou clique para selecionar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onClick={handleFileSelect}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-medium mb-2">
                {isUploading ? 'Processando...' : 'Clique para selecionar arquivo'}
              </p>
              <p className="text-sm text-slate-500">
                Formatos suportados: .xlsx, .xls, .csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📋 Formato Esperado
              </h4>
              <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
                A planilha deve conter as seguintes colunas:
              </p>
              <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1 list-disc list-inside">
                <li><strong>Data:</strong> Data da transação (dd/mm/aaaa)</li>
                <li><strong>Descrição:</strong> Descrição da transação</li>
                <li><strong>Categoria:</strong> Categoria (Vendas, Compras, etc.)</li>
                <li><strong>Valor:</strong> Valor da transação</li>
                <li><strong>Tipo:</strong> Receita ou Despesa</li>
                <li><strong>Status:</strong> Pago, Pendente ou Atrasado</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização dos Dados</CardTitle>
              <CardDescription>
                {previewData.length} registros prontos para importação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-96 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 10).map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{record.data}</TableCell>
                        <TableCell>{record.descricao}</TableCell>
                        <TableCell>{record.categoria}</TableCell>
                        <TableCell>
                          <Badge variant={record.tipo === 'receita' ? 'default' : 'secondary'}>
                            {record.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className={record.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(record.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              record.status === 'pago' ? 'default' : 
                              record.status === 'atrasado' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {previewData.length > 10 && (
                <p className="text-sm text-slate-500 text-center">
                  Mostrando 10 de {previewData.length} registros
                </p>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button onClick={cancelImport} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={confirmImport}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Importação
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Histórico de Importações</CardTitle>
                <CardDescription>
                  Últimas importações realizadas
                </CardDescription>
              </div>
              {importHistory.length > 0 && (
                <Button onClick={clearHistory} variant="outline" size="sm" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {importHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma importação realizada ainda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.fileName}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.recordsImported} registros</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.status === 'success' ? 'default' : 
                            item.status === 'error' ? 'destructive' : 
                            'secondary'
                          }
                          className="gap-1"
                        >
                          {item.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'error' && <AlertCircle className="w-3 h-3" />}
                          {item.status === 'success' ? 'Sucesso' : 
                           item.status === 'error' ? 'Erro' : 
                           'Parcial'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Configurações de Atualização Automática */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Atualização Automática
            </CardTitle>
            <CardDescription>
              Configure a sincronização automática de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sincronização Periódica</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Atualizar dados automaticamente a cada intervalo definido
                </p>
              </div>
              <Badge variant="secondary">Em breve</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Importação por Email</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Receber planilhas por email e importar automaticamente
                </p>
              </div>
              <Badge variant="secondary">Em breve</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Integração com Google Sheets</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sincronizar dados diretamente do Google Sheets
                </p>
              </div>
              <Badge variant="secondary">Em breve</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
