import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { useState, useEffect, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { isAuthenticated } from "./lib/auth";
import { useTokenRefresh } from "./hooks/useTokenRefresh";

// Componente de loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// ========================================
// LAZY LOADING - Páginas carregadas sob demanda
// ========================================

// Páginas públicas (carregar imediatamente)
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import NotFound from "@/pages/NotFound";
import Forbidden from './pages/Forbidden';

// Layout (carregar imediatamente)
import CRMLayout from "./components/CRMLayout";

// Páginas principais (lazy load)
const DashboardCRM = lazy(() => import("./pages/DashboardCRM"));
const Setup = lazy(() => import("./pages/Setup"));
const API = lazy(() => import("./pages/API"));
const Docs = lazy(() => import("./pages/Docs"));
const Callback = lazy(() => import("./pages/Callback"));
const Setup2FA = lazy(() => import("./pages/Setup2FA"));
const Verify2FA = lazy(() => import("./pages/Verify2FA"));
const Settings = lazy(() => import('./pages/Settings'));
const Metricas = lazy(() => import('./pages/Metricas'));
const ChatIA = lazy(() => import('./pages/ChatIA'));
const PosVendas = lazy(() => import('./pages/PosVendas'));
const Entregas = lazy(() => import("@/pages/Entregas"));
const NotasFiscais = lazy(() => import("@/pages/NotasFiscais"));

// Páginas operacionais
const Produtos = lazy(() => import("@/pages/Produtos"));
const AnaliseVendas = lazy(() => import("@/pages/AnaliseVendas"));
const Pedidos = lazy(() => import('./pages/Pedidos'));
const Importacao = lazy(() => import('./pages/Importacao'));
const InteligenciaMercado = lazy(() => import('./pages/InteligenciaMercado'));
const TabelaPreco = lazy(() => import('./pages/TabelaPreco'));
const Anuncios = lazy(() => import('./pages/Anuncios'));

// Páginas financeiras
const ContasPagar = lazy(() => import('./pages/ContasPagar'));
const ContasReceber = lazy(() => import('./pages/ContasReceber'));
const FluxoCaixa = lazy(() => import('./pages/FluxoCaixa'));
const ImportacaoFinanceira = lazy(() => import('./pages/ImportacaoFinanceira'));

// Páginas de administração
const Users = lazy(() => import('./pages/Users'));
const AdminMaster = lazy(() => import('./pages/AdminMaster'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const StatusIntegracoes = lazy(() => import('./pages/StatusIntegracoes'));
const MonitoramentoAPIs = lazy(() => import('./pages/MonitoramentoAPIs'));

// Integrações
const MercadoLivre = lazy(() => import('./pages/MercadoLivre'));
const IntegracaoMercadoLivre = lazy(() => import('./pages/IntegracaoMercadoLivre'));
const CalculadoraTaxasML = lazy(() => import('./pages/CalculadoraTaxasML'));
const WebhookSimulator = lazy(() => import('./pages/WebhookSimulator'));
const MLAPITests = lazy(() => import('./pages/MLAPITests'));
const IntegracaoShopee = lazy(() => import('./pages/IntegracaoShopee'));
const IntegracaoAmazon = lazy(() => import('./pages/IntegracaoAmazon'));
const IntegracaoMagalu = lazy(() => import('./pages/IntegracaoMagalu'));
const IntegracaoPagBank = lazy(() => import('./pages/IntegracaoPagBank'));
const IntegracaoStripe = lazy(() => import('./pages/IntegracaoStripe'));
const IntegracaoCorreios = lazy(() => import('./pages/IntegracaoCorreios'));
const IntegracaoMelhorEnvio = lazy(() => import('./pages/IntegracaoMelhorEnvio'));
const IntegracaoJadlog = lazy(() => import('./pages/IntegracaoJadlog'));

// Control Tower
const ControlTowerDashboard = lazy(() => import('./pages/ControlTower/Dashboard'));
const ControlTowerPlatforms = lazy(() => import('./pages/ControlTower/Platforms'));
const ControlTowerClients = lazy(() => import('./pages/ControlTower/Clients'));
const ControlTowerDemands = lazy(() => import('./pages/ControlTower/Demands'));
const ControlTowerWorkLogs = lazy(() => import('./pages/ControlTower/WorkLogs'));
const ControlTowerContracts = lazy(() => import('./pages/ControlTower/Contracts'));

// Super Admin
const SuperAdminLogin = lazy(() => import('./pages/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const SuperAdminTenants = lazy(() => import('./pages/SuperAdminTenants'));

// Páginas públicas (footer)
const Cadastro = lazy(() => import('./pages/Cadastro'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Sobre = lazy(() => import('./pages/Sobre'));
const Contato = lazy(() => import('./pages/Contato'));
const Termos = lazy(() => import('./pages/Termos'));
const Privacidade = lazy(() => import('./pages/Privacidade'));

// SEO Pages
const CalculatorPage = lazy(() => import('./pages/services/CalculatorPage'));
const ConciliacaoPage = lazy(() => import('./pages/services/ConciliacaoPage'));
const GestaoPedidosPage = lazy(() => import('./pages/services/GestaoPedidosPage'));
const DashboardSalesPage = lazy(() => import('./pages/services/DashboardSalesPage'));

// Páginas "Em breve"
const EmBreveBase = lazy(() => import('./pages/EmBreve'));
const EmBreve = () => <EmBreveBase titulo="Em Breve" descricao="Estamos trabalhando nesta funcionalidade" />;

// Smart Biz360 - Novos módulos
const Register = lazy(() => import('./pages/Register'));
const Subscription = lazy(() => import('./pages/Subscription'));
const FluxoCaixaInteligente = lazy(() => import('./pages/FluxoCaixaInteligente'));
const GestaoEquipe = lazy(() => import('./pages/GestaoEquipe'));

function Router() {
  // Check if user is authenticated via localStorage with state
  const [authenticated, setAuthenticated] = useState(() => {
    const userStr = localStorage.getItem('markethub_user');
    return !!userStr;
  });

  // Listen for storage changes
  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('markethub_user');
      setAuthenticated(!!userStr);
    };

    window.addEventListener('storage', checkAuth);
    // Also check periodically
    const interval = setInterval(checkAuth, 500);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  // Super Admin routes (separate from CRM)
  const isSuperAdminRoute = window.location.pathname.startsWith('/super-admin');

  if (isSuperAdminRoute) {
    return (
      <Switch>
        <Route path="/super-admin/login" component={SuperAdminLogin} />
        <Route path="/super-admin/dashboard" component={SuperAdminDashboard} />
        <Route path="/super-admin/tenants" component={SuperAdminTenants} />
        <Route path="/super-admin" component={SuperAdminLogin} />
      </Switch>
    );
  }

  // Public routes (no authentication required)
  if (!authenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={LandingPage} />

          {/* SEO Pages */}
          <Route path="/funcionalidades/calculadora-mercado-livre" component={CalculatorPage} />
          <Route path="/funcionalidades/conciliacao-financeira" component={ConciliacaoPage} />
          <Route path="/funcionalidades/gestao-pedidos" component={GestaoPedidosPage} />
          <Route path="/funcionalidades/dashboard-vendas" component={DashboardSalesPage} />

          <Route path="/login" component={Login} />
          <Route path="/cadastro" component={Cadastro} />
          <Route path="/register" component={Register} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/verify-2fa" component={Verify2FA} />
          <Route path="/callback" component={Callback} />
          <Route path="/sobre" component={Sobre} />
          <Route path="/contato" component={Contato} />
          <Route path="/termos" component={Termos} />
          <Route path="/privacidade" component={Privacidade} />
          <Route path="/blog" component={EmBreve} />
          <Route path="/tutoriais" component={EmBreve} />
          <Route path="/base-conhecimento" component={EmBreve} />
          <Route path="/api-docs" component={EmBreve} />
          <Route path="/integracoes" component={EmBreve} />
          <Route path="/roadmap" component={EmBreve} />
          <Route component={LandingPage} />
        </Switch>
      </Suspense>
    );
  }

  // Protected routes (authentication required)
  return (
    <CRMLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path={"/"} component={DashboardCRM} />
          <Route path="/home" component={LandingPage} />
          <Route path="/landing" component={LandingPage} />
          <Route path="/chat" component={ChatIA} />
          <Route path="/pos-vendas" component={PosVendas} />
          <Route path="/callback" component={Callback} />
          <Route path="/pedidos" component={Pedidos} />
          <Route path="/produtos" component={Produtos} />
          <Route path={"/anuncios"} component={Anuncios} />
          <Route path={"/clientes"} component={API} />
          <Route path="/entregas" component={Entregas} />
          <Route path="/notas-fiscais" component={NotasFiscais} />
          <Route path="/contas-pagar" component={ContasPagar} />
          <Route path="/contas-receber" component={ContasReceber} />
          <Route path="/fluxo-caixa" component={FluxoCaixa} />
          <Route path={"/notas"} component={API} />
          <Route path="/relatorios" component={API} />
          <Route path="/vendas" component={AnaliseVendas} />
          <Route path="/configuracoes" component={Settings} />
          <Route path="/setup-2fa" component={Setup2FA} />
          <Route path="/importacao" component={Importacao} />
          <Route path="/inteligencia-mercado" component={InteligenciaMercado} />
          <Route path="/tabela-preco" component={TabelaPreco} />
          <Route path="/metricas" component={Metricas} />
          <Route path="/usuarios" component={Users} />
          <Route path="/mercado-livre" component={MercadoLivre} />
          <Route path="/integracoes/mercadolivre" component={IntegracaoMercadoLivre} />
          <Route path="/integracoes/shopee" component={IntegracaoShopee} />
          <Route path="/integracoes/amazon" component={IntegracaoAmazon} />
          <Route path="/integracoes/magalu" component={IntegracaoMagalu} />
          <Route path="/integracoes/pagbank" component={IntegracaoPagBank} />
          <Route path="/integracoes/stripe" component={IntegracaoStripe} />
          <Route path="/integracoes/correios" component={IntegracaoCorreios} />
          <Route path="/integracoes/melhorenvio" component={IntegracaoMelhorEnvio} />
          <Route path="/integracoes/jadlog" component={IntegracaoJadlog} />
          <Route path="/importacao-financeira" component={ImportacaoFinanceira} />
          <Route path="/calculadora-taxas-ml" component={CalculadoraTaxasML} />
          <Route path="/webhook-simulator" component={WebhookSimulator} />
          <Route path="/ml-api-tests" component={MLAPITests} />
          <Route path="/admin-master" component={AdminMaster} />
          <Route path="/system-status" component={SystemStatus} />
          <Route path="/status-integracoes" component={StatusIntegracoes} />
          <Route path="/monitoramento-apis" component={MonitoramentoAPIs} />
          {/* Smart Biz360 - Novos módulos */}
          <Route path="/settings/subscription" component={Subscription} />
          <Route path="/fluxo-caixa-inteligente" component={FluxoCaixaInteligente} />
          <Route path="/gestao-equipe" component={GestaoEquipe} />
          {/* Control Tower */}
          <Route path="/control-tower" component={ControlTowerDashboard} />
          <Route path="/control-tower/plataformas" component={ControlTowerPlatforms} />
          <Route path="/control-tower/clientes" component={ControlTowerClients} />
          <Route path="/control-tower/demandas" component={ControlTowerDemands} />
          <Route path="/control-tower/apontamentos" component={ControlTowerWorkLogs} />
          <Route path="/control-tower/contratos" component={ControlTowerContracts} />
          <Route path={"/docs"} component={Docs} />
          <Route path={"/403"} component={Forbidden} />
          <Route path={"/404"} component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </CRMLayout>
  );
}

function App() {
  // Inicia monitoramento de renovação automática de token
  useTokenRefresh();

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}


export default App;
