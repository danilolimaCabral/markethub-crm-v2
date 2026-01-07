import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Download,
  FileText
} from 'lucide-react';

interface ValidationResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    entity: string;
    fileName: string;
    processedAt: string;
    duration: number;
  };
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'critical';
}

interface ValidationWarning {
  row: number;
  field: string;
  value: any;
  message: string;
}

export default function ValidacaoPlanilhas() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<'produtos' | 'pedidos' | 'clientes'>('produtos');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setError(null);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) {
      setError('Selecione um arquivo para validar');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', entityType);

      const response = await fetch('/api/spreadsheet-validation/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao validar planilha');
      }

      setValidationResult(data.result);
    } catch (err: any) {
      setError(err.message || 'Erro ao validar planilha');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownloadExample = async () => {
    try {
      const response = await fetch(`/api/spreadsheet-validation/example/${entityType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao baixar exemplo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exemplo_${entityType}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Erro ao baixar exemplo');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Validação de Planilhas</h1>
          <p className="text-muted-foreground mt-2">
            Faça upload de planilhas Excel ou CSV para validar dados antes de importar
          </p>
        </div>
      </div>

      {/* Seleção de Tipo de Entidade */}
      <Card>
        <CardHeader>
          <CardTitle>1. Selecione o Tipo de Dados</CardTitle>
          <CardDescription>
            Escolha o tipo de dados que você deseja validar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={entityType === 'produtos' ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => setEntityType('produtos')}
            >
              <FileSpreadsheet className="h-8 w-8" />
              <span>Produtos</span>
            </Button>
            <Button
              variant={entityType === 'pedidos' ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => setEntityType('pedidos')}
            >
              <FileText className="h-8 w-8" />
              <span>Pedidos</span>
            </Button>
            <Button
              variant={entityType === 'clientes' ? 'default' : 'outline'}
              className="h-24 flex flex-col gap-2"
              onClick={() => setEntityType('clientes')}
            >
              <FileText className="h-8 w-8" />
              <span>Clientes</span>
            </Button>
          </div>
          
          <div className="mt-4">
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleDownloadExample}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar planilha de exemplo para {entityType}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload de Arquivo */}
      <Card>
        <CardHeader>
          <CardTitle>2. Faça Upload da Planilha</CardTitle>
          <CardDescription>
            Formatos aceitos: .xlsx, .xls, .csv (máximo 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou arraste e solte aqui
                  </p>
                </div>
              </label>
            </div>

            <Button
              onClick={handleValidate}
              disabled={!selectedFile || isValidating}
              className="w-full"
              size="lg"
            >
              {isValidating ? 'Validando...' : 'Validar Planilha'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultado da Validação */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.success ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              Resultado da Validação
            </CardTitle>
            <CardDescription>
              Arquivo: {validationResult.summary.fileName} • 
              Processado em {validationResult.summary.duration}ms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total de Linhas</p>
                <p className="text-2xl font-bold">{validationResult.totalRows}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Linhas Válidas</p>
                <p className="text-2xl font-bold text-green-600">
                  {validationResult.validRows}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Linhas com Erro</p>
                <p className="text-2xl font-bold text-red-600">
                  {validationResult.invalidRows}
                </p>
              </div>
            </div>

            {/* Erros */}
            {validationResult.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Erros Encontrados ({validationResult.errors.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {validationResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>
                        <strong>Linha {error.row}</strong> • Campo: {error.field}
                        <br />
                        {error.message}
                        {error.value && (
                          <span className="text-xs"> (Valor: {String(error.value)})</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Avisos */}
            {validationResult.warnings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Avisos ({validationResult.warnings.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {validationResult.warnings.map((warning, index) => (
                    <Alert key={index}>
                      <AlertDescription>
                        <strong>Linha {warning.row}</strong> • Campo: {warning.field}
                        <br />
                        {warning.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Sucesso */}
            {validationResult.success && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Planilha validada com sucesso! Todos os dados estão corretos e prontos para importação.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
