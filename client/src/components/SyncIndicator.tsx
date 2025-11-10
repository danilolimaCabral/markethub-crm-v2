import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface SyncIndicatorProps {
  onRefresh?: () => void;
}

export default function SyncIndicator({ onRefresh }: SyncIndicatorProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState('agora mesmo');
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | 'syncing'>('success');

  // Atualizar "tempo atrás" a cada minuto
  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);

      if (diff < 60) {
        setTimeAgo('agora mesmo');
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setTimeAgo(`${minutes} min atrás`);
      } else {
        const hours = Math.floor(diff / 3600);
        setTimeAgo(`${hours}h atrás`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(autoRefreshInterval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSyncStatus('syncing');

    try {
      // Simular chamada de API ou scraping
      await new Promise(resolve => setTimeout(resolve, 2000));

      setLastUpdate(new Date());
      setSyncStatus('success');
      toast.success('Dados atualizados com sucesso!');

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setSyncStatus('error');
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'success':
        return 'Sincronizado';
      case 'error':
        return 'Erro';
      case 'syncing':
        return 'Sincronizando...';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'syncing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
      <Badge variant="outline" className={`flex items-center gap-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
      </Badge>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Última atualização: {timeAgo}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="ml-auto gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
    </div>
  );
}
