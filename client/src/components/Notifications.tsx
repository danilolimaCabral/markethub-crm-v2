import { Bell, Package, ShoppingCart, DollarSign, MessageSquare, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: 'estoque' | 'pedido' | 'financeiro' | 'mensagem';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Verificar notificações a cada 30 segundos
    const interval = setInterval(() => {
      checkForNewNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const stored = localStorage.getItem('markethub_notifications');
    if (stored) {
      const notifs = JSON.parse(stored);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.read).length);
    } else {
      // Criar notificações iniciais de exemplo
      const initialNotifications: Notification[] = [];
      
      // Verificar produtos com estoque baixo
      const produtosStr = localStorage.getItem('markethub_produtos');
      if (produtosStr) {
        const produtos = JSON.parse(produtosStr);
        const baixoEstoque = produtos.filter((p: any) => p.estoque < 10);
        
        if (baixoEstoque.length > 0) {
          initialNotifications.push({
            id: Date.now().toString(),
            type: 'estoque',
            title: 'Estoque Baixo',
            message: `${baixoEstoque.length} produto(s) com estoque abaixo de 10 unidades`,
            timestamp: new Date().toISOString(),
            read: false
          });
        }
      }
      
      if (initialNotifications.length > 0) {
        localStorage.setItem('markethub_notifications', JSON.stringify(initialNotifications));
        setNotifications(initialNotifications);
        setUnreadCount(initialNotifications.length);
      }
    }
  };

  const checkForNewNotifications = () => {
    // Verificar produtos com estoque baixo
    const produtosStr = localStorage.getItem('markethub_produtos');
    if (produtosStr) {
      const produtos = JSON.parse(produtosStr);
      const baixoEstoque = produtos.filter((p: any) => p.estoque < 10);
      
      if (baixoEstoque.length > 0) {
        const existingNotif = notifications.find(n => n.type === 'estoque' && !n.read);
        
        if (!existingNotif) {
          const newNotif: Notification = {
            id: Date.now().toString(),
            type: 'estoque',
            title: 'Estoque Baixo',
            message: `${baixoEstoque.length} produto(s) com estoque abaixo de 10 unidades`,
            timestamp: new Date().toISOString(),
            read: false
          };
          
          const updated = [newNotif, ...notifications];
          setNotifications(updated);
          setUnreadCount(updated.filter(n => !n.read).length);
          localStorage.setItem('markethub_notifications', JSON.stringify(updated));
          
          toast.warning('Nova notificação: Estoque Baixo');
        }
      }
    }
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    localStorage.setItem('markethub_notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem('markethub_notifications', JSON.stringify(updated));
    toast.success('Todas as notificações marcadas como lidas');
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('markethub_notifications');
    toast.success('Notificações limpas');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'estoque':
        return <Package className="h-4 w-4 text-yellow-500" />;
      case 'pedido':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'financeiro':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'mensagem':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={markAllAsRead}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={clearAll}
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notif.read ? 'bg-accent/50' : ''
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{notif.title}</p>
                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(notif.timestamp)}</p>
                </div>
                {!notif.read && (
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
