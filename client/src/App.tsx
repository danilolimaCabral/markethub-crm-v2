import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useState, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CRMLayout from "./components/CRMLayout";
import DashboardCRM from "./pages/DashboardCRM";
import Setup from "./pages/Setup";
import API from "./pages/API";
import Docs from "./pages/Docs";
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import LandingPage from "./pages/LandingPage";
import Setup2FA from "./pages/Setup2FA";
import Verify2FA from "./pages/Verify2FA";
import Settings from './pages/Settings';
import Metricas from './pages/Metricas';
import ChatIA from './pages/ChatIA';
import PosVendas from './pages/PosVendas';
import Entregas from "@/pages/Entregas";
import NotasFiscais from "@/pages/NotasFiscais";
import Produtos from "@/pages/Produtos";
import AnaliseVendas from "@/pages/AnaliseVendas";
import Pedidos from './pages/Pedidos';
import Importacao from './pages/Importacao';
import InteligenciaMercado from './pages/InteligenciaMercado';
import TabelaPreco from './pages/TabelaPreco';
import ContasPagar from './pages/ContasPagar';
import ContasReceber from './pages/ContasReceber';
import FluxoCaixa from './pages/FluxoCaixa';
import Users from './pages/Users';
import MercadoLivre from './pages/MercadoLivre';
import ImportacaoFinanceira from './pages/ImportacaoFinanceira';
import CalculadoraTaxasML from './pages/CalculadoraTaxasML';
import Forbidden from './pages/Forbidden';
import Cadastro from './pages/Cadastro';
import Onboarding from './pages/Onboarding';
import WebhookSimulator from './pages/WebhookSimulator';
import { isAuthenticated } from "./lib/auth";
import { useTokenRefresh } from "./hooks/useTokenRefresh";

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

  // Public routes (no authentication required)
  if (!authenticated) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={Login} />
        <Route path="/cadastro" component={Cadastro} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/verify-2fa" component={Verify2FA} />
        <Route path="/callback" component={Callback} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  // Protected routes (authentication required)
  return (
    <CRMLayout>
      <Switch>
        <Route path={"/"} component={DashboardCRM} />
          <Route path="/chat" component={ChatIA} />
          <Route path="/pos-vendas" component={PosVendas} />
        <Route path="/callback" component={Callback} />
        <Route path="/pedidos" component={Pedidos} />
        <Route path="/produtos" component={Produtos} />
        <Route path={"/anuncios"} component={API} />
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
        <Route path="/importacao-financeira" component={ImportacaoFinanceira} />
        <Route path="/calculadora-taxas-ml" component={CalculadoraTaxasML} />
        <Route path="/webhook-simulator" component={WebhookSimulator} />
        <Route path={"/docs"} component={Docs} />
        <Route path={"/403"} component={Forbidden} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </CRMLayout>
  );
}

function App() {
  // Inicia monitoramento de renovação automática de token
  useTokenRefresh();

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
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
