// Build: 2025-12-12T12:35:00 - Force rebuild with cache bust
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Activity,
  Zap,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  responseTime: number;
  statusCode: number | null;
  errorMessage: string | null;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  pendingTests: number;
  totalTime: number;
  avgResponseTime: number;
}

export default function MLAPIMonitor() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runTests = async () => {
    try {
      setIsRunning(true);
      setProgress(0);
      
      toast.info('Iniciando testes da API do Mercado Livre...');

      const response = await axios.post(
        '/api/mercadolivre/test-api',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setTests(response.data.tests);
      setSummary(response.data.summary);
      setProgress(100);

      if (response.data.summary.failedTests === 0) {
        toast.success('Todos os testes passaram com sucesso!');
      } else {
        toast.warning(`${response.data.summary.failedTests} teste(s) falharam`);
      }
    } catch (error: any) {
      console.error('Erro ao executar testes:', error);
      toast.error('Erro ao executar testes da API');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      success: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline',
    };

    const labels: Record<string, string> = {
      success: 'Sucesso',
      failed: 'Falha',
      running: 'Executando',
      pending: 'Pendente',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento da API</h2>
          <p className="text-muted-foreground mt-1">
            Valide a conexão e funcionalidade dos endpoints da API do Mercado Livre
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          size="lg"
          className="gap-2"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Executar Testes
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Testes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTests}</div>
              <p className="text-xs text-muted-foreground">
                Endpoints testados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.totalTests > 0
                  ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.passedTests} de {summary.totalTests} passaram
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(summary.avgResponseTime)}ms</div>
              <p className="text-xs text-muted-foreground">
                Tempo de resposta médio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Testes Falhados</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.failedTests}</div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progresso dos Testes</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados dos Testes</CardTitle>
          <CardDescription>
            Status detalhado de cada endpoint testado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum teste executado ainda.</p>
              <p className="text-sm mt-2">Clique em "Executar Testes" para iniciar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(test.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{test.name}</h4>
                      {getStatusBadge(test.status)}
                    </div>
                    
                    <p className="text-xs text-muted-foreground font-mono truncate mb-2">
                      {test.endpoint}
                    </p>
                    
                    {test.errorMessage && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span>{test.errorMessage}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    {test.responseTime > 0 && (
                      <div className="text-sm font-medium">
                        {Math.round(test.responseTime)}ms
                      </div>
                    )}
                    {test.statusCode && (
                      <div className="text-xs text-muted-foreground">
                        HTTP {test.statusCode}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
