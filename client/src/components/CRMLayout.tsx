import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import GlobalSearch from './GlobalSearch';
import ChatGemini from './ChatGemini';
import Notifications from './Notifications';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Megaphone,
  Users,
  Truck,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  MessageSquare,
  TrendingUp,
  PieChart,
  Calculator,
  Headphones,
  Menu,
  X,
  Target
} from 'lucide-react';
import { logout } from '@/lib/auth';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  color: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Mapeamento de rotas para módulos de permissão
const ROUTE_TO_MODULE: Record<string, string> = {
  '/': 'dashboard',
  '/chat': 'chat',
  '/pedidos': 'pedidos',
  '/produtos': 'produtos',
  '/anuncios': 'anuncios',
  '/clientes': 'clientes',
  '/entregas': 'entregas',
  '/notas-fiscais': 'notas-fiscais',
  '/pos-vendas': 'pos-vendas',
  '/importacao': 'importacao',
  '/inteligencia-mercado': 'inteligencia-mercado',
  '/tabela-preco': 'tabela-preco',
  '/contas-pagar': 'contas-pagar',
  '/contas-receber': 'contas-receber',
  '/fluxo-caixa': 'fluxo-caixa',
  '/notas': 'notas-fiscais',
  '/precos': 'tabela-preco',
  '/relatorios': 'relatorios',
  '/vendas': 'vendas',
  '/metricas': 'metricas',
  '/usuarios': 'usuarios',
  '/configuracoes': 'configuracoes',
  '/mercado-livre': 'mercado-livre',
  '/calculadora-taxas-ml': 'calculadora-taxas-ml',
  '/importacao-financeira': 'importacao-financeira',
  '/admin-master': 'admin-master',
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { hasPermission, isAdmin } = usePermissions();

  // Atalho Ctrl+K para abrir pesquisa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  // Navegação organizada conforme layout solicitado
  const navSections: NavSection[] = [
    {
      title: "CENTRAL",
      items: [
        { path: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard", color: "text-blue-500" },
        { path: "/chat", icon: <MessageSquare size={20} />, label: "Assistente IA", color: "text-blue-500" },
      ]
    },
    {
      title: 'OPERACIONAL',
      items: [
        { path: '/pedidos', icon: <ShoppingCart size={20} />, label: 'Pedidos', color: 'text-cyan-500' },
        { path: '/produtos', icon: <Package size={20} />, label: 'Produtos', color: 'text-blue-500' },
        { path: '/anuncios', icon: <Megaphone size={20} />, label: 'Anúncios', color: 'text-yellow-500' },
        { path: '/catalogo', icon: <Users size={20} />, label: 'Catálogo', color: 'text-orange-500' },
        { path: '/logistica', icon: <Truck size={20} />, label: 'Logística', color: 'text-green-500' },
        { path: '/logistica-2', icon: <Truck size={20} />, label: 'Logística', color: 'text-blue-500' },
        { path: '/postagens', icon: <FileText size={20} />, label: 'Postagens', color: 'text-blue-500' },
        { path: '/marketing', icon: <Megaphone size={20} />, label: 'Marketing', color: 'text-orange-500' },
        { path: '/comunicacao', icon: <MessageSquare size={20} />, label: 'Comunicação', color: 'text-blue-500' },
        { path: '/chat-suporte', icon: <MessageSquare size={20} />, label: 'Chat', color: 'text-blue-500' },
        { path: '/chat-interno', icon: <MessageSquare size={20} />, label: 'Chat', color: 'text-cyan-500' },
        { path: '/atendimento', icon: <Headphones size={20} />, label: 'Atendimento', color: 'text-teal-500' },
        { path: '/clientes', icon: <Users size={20} />, label: 'Clientes', color: 'text-orange-500' },
        { path: '/clientes-2', icon: <Users size={20} />, label: 'Clientes', color: 'text-blue-500' },
        { path: '/leads', icon: <FileText size={20} />, label: 'Lista de Leads', color: 'text-orange-500' },
        { path: '/calendario', icon: <FileText size={20} />, label: 'Calendário', color: 'text-orange-500' },
      ]
    },
    {
      title: "FINANCEIRO",
      items: [
        { path: "/receitas", icon: <DollarSign size={20} />, label: "Receitas", color: "text-green-500" },
        { path: "/despesas", icon: <DollarSign size={20} />, label: "Despesas", color: "text-purple-500" },
        { path: "/comissoes", icon: <DollarSign size={20} />, label: "Comissões", color: "text-red-500" },
        { path: "/comissoes-2", icon: <BarChart3 size={20} />, label: "Comissões", color: "text-blue-500" },
      ]
    },
    {
      title: "ANÁLISE",
      items: [
        { path: "/conversoes", icon: <TrendingUp size={20} />, label: "Conversões", color: "text-blue-500" },
        { path: "/relatorios", icon: <BarChart3 size={20} />, label: "Relatórios", color: "text-blue-500" },
      ]
    },
    {
      title: "INTEGRAÇÕES",
      items: [
        { path: "/integracoes", icon: <Target size={20} />, label: "Integrações", color: "text-cyan-500" },
      ]
    },
    {
      title: "ADMINISTRAÇÃO",
      items: [
        { path: "/configuracoes", icon: <Settings size={20} />, label: "Configurações", color: "text-slate-500" },
        { path: "/usuarios", icon: <Users size={20} />, label: "Usuários", color: "text-blue-500" },
        { path: "/permissoes", icon: <Settings size={20} />, label: "Permissões", color: "text-slate-500" },
        { path: "/logs", icon: <FileText size={20} />, label: "Log de acessos", color: "text-slate-500" },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay - Mobile only */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40
        w-64 bg-card border-r border-border flex flex-col overflow-hidden
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo/Header */}
        <div className="p-3 md:p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-base md:text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate">Markthub CRM</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Venda mais, lucre mais</p>
            </div>
            <Notifications />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 md:p-3 space-y-4 md:space-y-6">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {/* Section Title */}
              <div className="px-3 mb-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h2>
              </div>
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items
                  // TODOS OS MÓDULOS LIBERADOS - Removido filtro de permissões
                  .map((item) => {
                    const isActive = location === item.path;
                    return (
                      <Link key={item.path} href={item.path}>
                        <div
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                            transition-all duration-200
                            ${isActive 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                            }
                          `}
                        >
                          <span className={isActive ? 'text-primary-foreground' : item.color}>
                            {item.icon}
                          </span>
                          <span className="flex-1 font-medium text-sm">{item.label}</span>
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-border">
          <Link href="/configuracoes">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent transition-colors mb-2">
              <Settings size={20} className="text-muted-foreground" />
              <span className="flex-1 font-medium text-sm text-foreground">Configurações</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 px-3 py-2.5 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Usuário</p>
              <p className="text-xs text-muted-foreground truncate">contato@markthubcrm.com.br</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Assistente IA Flutuante */}
      <ChatGemini />
    </div>
  );
}
