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
  Target,
  Activity,
  Building2,
  Server,
  ClipboardList,
  Clock,
  FileSignature
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
  '/status-integracoes': 'configuracoes',
  '/monitoramento-apis': 'configuracoes',
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { hasPermission, isAdmin } = usePermissions();
  const [userInfo, setUserInfo] = useState<any>(null);

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userStr = localStorage.getItem('markethub_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserInfo(user);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    };
    fetchUserInfo();
  }, []);

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

  // Navegação organizada por seções estilo Pulse
  const navSections: NavSection[] = [
    {
      title: "Central",
      items: [
        { path: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard", color: "text-blue-500" },
        { path: "/chat", icon: <MessageSquare size={20} />, label: "Assistente IA", color: "text-purple-500" },
      ]
    },
    {
      title: 'OPERACIONAL',
      items: [
        { path: '/pedidos', icon: <ShoppingCart size={20} />, label: 'Pedidos', badge: 12, color: 'text-orange-500' },
        { path: '/produtos', icon: <Package size={20} />, label: 'Produtos', color: 'text-green-500' },
        { path: '/anuncios', icon: <Megaphone size={20} />, label: 'Anúncios', color: 'text-red-500' },
        { path: '/clientes', icon: <Users size={20} />, label: 'Clientes', color: 'text-cyan-500' },
        { path: '/entregas', icon: <Truck size={20} />, label: 'Entregas', color: 'text-blue-500' },
        { path: '/notas-fiscais', icon: <FileText size={20} />, label: 'Notas Fiscais', color: 'text-slate-500' },
        { path: '/pos-vendas', icon: <Headphones size={20} />, label: 'Pós-Vendas', color: 'text-teal-500' },
        { path: '/importacao', icon: <Calculator size={20} />, label: 'Importação', color: 'text-indigo-500' },
        { path: '/inteligencia-mercado', icon: <Target size={20} />, label: 'Inteligência de Mercado', color: 'text-purple-500' },
        { path: '/tabela-preco', icon: <DollarSign size={20} />, label: 'Tabela de Preços', color: 'text-green-500' },
      ]
    },
    {
      title: "Financeiro",
      items: [
        { path: "/contas-pagar", icon: <DollarSign size={20} />, label: "Contas a Pagar", color: "text-red-600" },
        { path: "/contas-receber", icon: <DollarSign size={20} />, label: "Contas a Receber", color: "text-green-600" },
        { path: "/fluxo-caixa", icon: <TrendingUp size={20} />, label: "Fluxo de Caixa", color: "text-blue-600" },
        { path: "/notas", icon: <FileText size={20} />, label: "Notas Fiscais", color: "text-slate-500" },
        { path: "/precos", icon: <Calculator size={20} />, label: "Tabela de Preços", color: "text-yellow-600" },
        { path: "/calculadora-taxas-ml", icon: <Calculator size={20} />, label: "Calculadora Taxas ML", color: "text-amber-600" },
      ]
    },
    {
      title: "Análise",
      items: [
        { path: "/relatorios", icon: <BarChart3 size={20} />, label: "Relatórios", color: "text-violet-500" },
        { path: "/vendas", icon: <TrendingUp size={20} />, label: "Análise de Vendas", color: "text-emerald-500" },
        { path: "/metricas", icon: <PieChart size={20} />, label: "Métricas", color: "text-pink-500" },
      ]
    },
    {
      title: "Integrações",
      items: [
        { path: "/mercado-livre", icon: <ShoppingCart size={20} />, label: "Mercado Livre", color: "text-yellow-500" },
        { path: "/importacao-financeira", icon: <FileText size={20} />, label: "Importação Financeira", color: "text-green-500" },
      ]
    },
    {
      title: "Control Tower",
      items: [
        { path: "/control-tower", icon: <Building2 size={20} />, label: "Dashboard", color: "text-indigo-500" },
        { path: "/control-tower/plataformas", icon: <Server size={20} />, label: "Plataformas", color: "text-blue-500" },
        { path: "/control-tower/clientes", icon: <Users size={20} />, label: "Clientes", color: "text-cyan-500" },
        { path: "/control-tower/demandas", icon: <ClipboardList size={20} />, label: "Demandas", color: "text-orange-500" },
        { path: "/control-tower/apontamentos", icon: <Clock size={20} />, label: "Apontamentos", color: "text-green-500" },
        { path: "/control-tower/contratos", icon: <FileSignature size={20} />, label: "Contratos", color: "text-purple-500" },
      ]
    },
    {
      title: "Administração",
      items: [
        { path: "/admin-master", icon: <Users size={20} />, label: "Painel Master", color: "text-pink-500" },
        { path: "/usuarios", icon: <Users size={20} />, label: "Usuários", color: "text-purple-500" },
        { path: "/status-integracoes", icon: <Activity size={20} />, label: "Status das Integrações", color: "text-blue-500" },
        { path: "/monitoramento-apis", icon: <Activity size={20} />, label: "Monitoramento de APIs", color: "text-green-500" },
        { path: "/configuracoes", icon: <Settings size={20} />, label: "Configurações", color: "text-slate-500" },
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
        w-64 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden
        transition-transform duration-300 ease-in-out shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo/Header */}
        <div className="p-4 md:p-5 border-b border-sidebar-border bg-sidebar">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-base text-sidebar-foreground truncate">Markthub CRM</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Gestão Inteligente</p>
            </div>
            <Notifications />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 md:p-4 space-y-5 md:space-y-6 bg-sidebar">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {/* Section Title */}
              <div className="px-2 mb-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {section.title}
                </h2>
              </div>
              
              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items
                  // TODOS OS MÓDULOS LIBERADOS - Removido filtro de permissões
                  .map((item) => {
                    const isActive = location === item.path;
                    return (
                      <Link key={item.path} href={item.path}>
                        <div
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer
                            transition-all duration-150 group
                            ${isActive 
                              ? 'bg-primary text-primary-foreground shadow-sm font-medium' 
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            }
                          `}
                        >
                          <span className={`transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'}`}>
                            {item.icon}
                          </span>
                          <span className={`flex-1 text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
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
              <span className="text-white font-bold text-sm">
                {userInfo?.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userInfo?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userInfo?.email || 'carregando...'}
              </p>
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
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Assistente IA Flutuante */}
      <ChatGemini />
    </div>
  );
}
// Force rebuild Fri Dec 13 12:55:00 BRT 2025 - Fixed overlay issue
