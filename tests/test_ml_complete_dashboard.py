#!/usr/bin/env python3
"""
Script de Teste Completo - API Mercado Livre
=============================================

Este script testa TODAS as APIs do Mercado Livre com um painel visual
mostrando progresso em tempo real, tempo de resposta e status de cada endpoint.

Autor: Manus AI
Data: 12 de dezembro de 2025
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

ML_CLIENT_ID = "7719573488458"
ML_CLIENT_SECRET = "mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD"
ML_REDIRECT_URI = "https://www.markthubcrm.com.br/callback/mercadolivre"
ML_API_BASE_URL = "https://api.mercadolibre.com"

# ============================================================================
# CLASSES DE DADOS
# ============================================================================

@dataclass
class TestResult:
    """Resultado de um teste individual."""
    name: str
    endpoint: str
    status: str = "pending"  # pending, running, success, failed
    response_time: float = 0.0
    status_code: Optional[int] = None
    error_message: Optional[str] = None
    data: Optional[Dict] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None

@dataclass
class TestSuite:
    """Suite de testes com estatísticas."""
    name: str
    tests: List[TestResult] = field(default_factory=list)
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    
    @property
    def total_tests(self) -> int:
        return len(self.tests)
    
    @property
    def passed_tests(self) -> int:
        return sum(1 for t in self.tests if t.status == "success")
    
    @property
    def failed_tests(self) -> int:
        return sum(1 for t in self.tests if t.status == "failed")
    
    @property
    def pending_tests(self) -> int:
        return sum(1 for t in self.tests if t.status == "pending")
    
    @property
    def total_time(self) -> float:
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return 0.0
    
    @property
    def avg_response_time(self) -> float:
        completed = [t for t in self.tests if t.response_time > 0]
        if not completed:
            return 0.0
        return sum(t.response_time for t in completed) / len(completed)

# ============================================================================
# CLASSE DE TESTE DO MERCADO LIVRE
# ============================================================================

class MercadoLivreAPITester:
    """Testa todas as APIs do Mercado Livre."""
    
    def __init__(self, access_token: Optional[str] = None):
        self.access_token = access_token
        self.suite = TestSuite(name="Mercado Livre API Tests")
        
    def _make_request(self, method: str, url: str, **kwargs) -> Tuple[bool, int, Dict, float]:
        """
        Faz uma requisição HTTP e retorna o resultado.
        
        Returns:
            Tuple[bool, int, Dict, float]: (sucesso, status_code, data, response_time)
        """
        start = time.time()
        try:
            if self.access_token:
                headers = kwargs.get('headers', {})
                headers['Authorization'] = f'Bearer {self.access_token}'
                kwargs['headers'] = headers
            
            kwargs['timeout'] = kwargs.get('timeout', 10)
            
            response = requests.request(method, url, **kwargs)
            response_time = time.time() - start
            
            try:
                data = response.json()
            except:
                data = {"text": response.text}
            
            success = 200 <= response.status_code < 300
            return success, response.status_code, data, response_time
            
        except Exception as e:
            response_time = time.time() - start
            return False, 0, {"error": str(e)}, response_time
    
    def _run_test(self, test: TestResult):
        """Executa um teste individual."""
        test.status = "running"
        test.start_time = time.time()
        self._update_dashboard()
        
        # Extrair método e URL do endpoint
        parts = test.endpoint.split(' ', 1)
        if len(parts) == 2:
            method, url = parts
        else:
            method, url = 'GET', parts[0]
        
        # Fazer requisição
        success, status_code, data, response_time = self._make_request(method, url)
        
        # Atualizar resultado
        test.end_time = time.time()
        test.response_time = response_time
        test.status_code = status_code
        test.data = data
        
        if success:
            test.status = "success"
        else:
            test.status = "failed"
            test.error_message = data.get('error', data.get('message', 'Unknown error'))
        
        self._update_dashboard()
    
    def _update_dashboard(self):
        """Atualiza o painel visual no terminal."""
        # Limpar tela (funciona em Unix/Linux/Mac)
        print("\033[2J\033[H", end="")
        
        # Cabeçalho
        print("=" * 100)
        print("  🚀 TESTE COMPLETO - API MERCADO LIVRE")
        print("=" * 100)
        print()
        
        # Informações gerais
        elapsed = time.time() - self.suite.start_time if self.suite.start_time else 0
        print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print(f"⏱️  Tempo decorrido: {elapsed:.2f}s")
        print(f"🔑 Client ID: {ML_CLIENT_ID}")
        print()
        
        # Estatísticas
        print("📊 ESTATÍSTICAS")
        print("-" * 100)
        print(f"  Total de testes: {self.suite.total_tests}")
        print(f"  ✅ Sucesso: {self.suite.passed_tests}")
        print(f"  ❌ Falha: {self.suite.failed_tests}")
        print(f"  ⏳ Pendente: {self.suite.pending_tests}")
        if self.suite.avg_response_time > 0:
            print(f"  ⚡ Tempo médio de resposta: {self.suite.avg_response_time*1000:.0f}ms")
        print()
        
        # Barra de progresso
        progress = (self.suite.passed_tests + self.suite.failed_tests) / self.suite.total_tests if self.suite.total_tests > 0 else 0
        bar_length = 50
        filled = int(bar_length * progress)
        bar = "█" * filled + "░" * (bar_length - filled)
        print(f"📈 Progresso: [{bar}] {progress*100:.1f}%")
        print()
        
        # Lista de testes
        print("🧪 TESTES")
        print("-" * 100)
        print(f"{'#':<4} {'Status':<10} {'Tempo':<10} {'Endpoint':<70}")
        print("-" * 100)
        
        for i, test in enumerate(self.suite.tests, 1):
            status_icon = {
                "pending": "⏳",
                "running": "🔄",
                "success": "✅",
                "failed": "❌"
            }.get(test.status, "❓")
            
            status_text = f"{status_icon} {test.status.upper()}"
            time_text = f"{test.response_time*1000:.0f}ms" if test.response_time > 0 else "-"
            
            # Truncar endpoint se muito longo
            endpoint_display = test.endpoint
            if len(endpoint_display) > 68:
                endpoint_display = endpoint_display[:65] + "..."
            
            print(f"{i:<4} {status_text:<10} {time_text:<10} {endpoint_display:<70}")
            
            # Mostrar erro se houver
            if test.status == "failed" and test.error_message:
                error_display = test.error_message
                if len(error_display) > 90:
                    error_display = error_display[:87] + "..."
                print(f"     └─ Erro: {error_display}")
        
        print("-" * 100)
        print()
        sys.stdout.flush()
    
    def add_test(self, name: str, endpoint: str):
        """Adiciona um teste à suite."""
        test = TestResult(name=name, endpoint=endpoint)
        self.suite.tests.append(test)
    
    def run_all_tests(self):
        """Executa todos os testes."""
        self.suite.start_time = time.time()
        
        for test in self.suite.tests:
            self._run_test(test)
            time.sleep(0.1)  # Pequena pausa para visualização
        
        self.suite.end_time = time.time()
        self._update_dashboard()
        
        # Resumo final
        print()
        print("=" * 100)
        print("  📋 RESUMO FINAL")
        print("=" * 100)
        print()
        print(f"  ⏱️  Tempo total: {self.suite.total_time:.2f}s")
        print(f"  ⚡ Tempo médio de resposta: {self.suite.avg_response_time*1000:.0f}ms")
        print(f"  ✅ Taxa de sucesso: {(self.suite.passed_tests/self.suite.total_tests*100):.1f}%")
        print()
        
        if self.suite.failed_tests > 0:
            print("  ❌ TESTES FALHADOS:")
            print()
            for test in self.suite.tests:
                if test.status == "failed":
                    print(f"     • {test.name}")
                    print(f"       Endpoint: {test.endpoint}")
                    print(f"       Erro: {test.error_message}")
                    print()
        
        print("=" * 100)
        print()

# ============================================================================
# CONFIGURAÇÃO DOS TESTES
# ============================================================================

def setup_tests(tester: MercadoLivreAPITester, access_token: Optional[str] = None):
    """Configura todos os testes a serem executados."""
    
    # ========== TESTES PÚBLICOS (SEM AUTENTICAÇÃO) ==========
    
    # Categorias
    tester.add_test("Listar Categorias", f"GET {ML_API_BASE_URL}/sites/MLB/categories")
    tester.add_test("Categoria Eletrônicos", f"GET {ML_API_BASE_URL}/categories/MLB1000")
    
    # Moedas
    tester.add_test("Listar Moedas", f"GET {ML_API_BASE_URL}/currencies")
    tester.add_test("Moeda BRL", f"GET {ML_API_BASE_URL}/currencies/BRL")
    
    # Sites
    tester.add_test("Listar Sites", f"GET {ML_API_BASE_URL}/sites")
    tester.add_test("Site Brasil", f"GET {ML_API_BASE_URL}/sites/MLB")
    
    # Países
    tester.add_test("Listar Países", f"GET {ML_API_BASE_URL}/countries")
    tester.add_test("País Brasil", f"GET {ML_API_BASE_URL}/countries/BR")
    
    # Estados
    tester.add_test("Listar Estados (BR)", f"GET {ML_API_BASE_URL}/countries/BR/states")
    tester.add_test("Estado São Paulo", f"GET {ML_API_BASE_URL}/states/BR-SP")
    
    # Cidades
    tester.add_test("Listar Cidades (SP)", f"GET {ML_API_BASE_URL}/states/BR-SP/cities")
    
    # Tipos de Listagem
    tester.add_test("Tipos de Listagem", f"GET {ML_API_BASE_URL}/sites/MLB/listing_types")
    
    # Exposições de Listagem
    tester.add_test("Exposições", f"GET {ML_API_BASE_URL}/sites/MLB/listing_exposures")
    
    # Métodos de Pagamento
    tester.add_test("Métodos de Pagamento", f"GET {ML_API_BASE_URL}/sites/MLB/payment_methods")
    
    # Tipos de Identificação
    tester.add_test("Tipos de Identificação", f"GET {ML_API_BASE_URL}/sites/MLB/identification_types")
    
    # ========== TESTES COM AUTENTICAÇÃO (SE TOKEN FORNECIDO) ==========
    
    if access_token:
        # Usuário
        tester.add_test("Informações do Usuário", f"GET {ML_API_BASE_URL}/users/me")
        
        # Produtos/Anúncios
        tester.add_test("Buscar Meus Anúncios", f"GET {ML_API_BASE_URL}/users/me/items/search")
        
        # Pedidos
        tester.add_test("Buscar Meus Pedidos (Vendedor)", f"GET {ML_API_BASE_URL}/orders/search?seller=me")
        tester.add_test("Buscar Meus Pedidos (Comprador)", f"GET {ML_API_BASE_URL}/orders/search?buyer=me")
        
        # Perguntas
        tester.add_test("Buscar Minhas Perguntas", f"GET {ML_API_BASE_URL}/questions/search?seller_id=me")
        
        # Mensagens
        tester.add_test("Listar Conversas", f"GET {ML_API_BASE_URL}/messages/packs?role=seller")
        
        # Notificações
        tester.add_test("Listar Notificações", f"GET {ML_API_BASE_URL}/myfeeds?app_id={ML_CLIENT_ID}")

# ============================================================================
# FUNÇÃO PRINCIPAL
# ============================================================================

def main():
    """Função principal."""
    print("\n🚀 Iniciando testes da API do Mercado Livre...\n")
    
    # Perguntar se tem access token
    print("Você tem um access token do Mercado Livre?")
    print("  1. Sim, tenho um token")
    print("  2. Não, testar apenas endpoints públicos")
    print()
    
    choice = input("Escolha (1 ou 2): ").strip()
    
    access_token = None
    if choice == "1":
        access_token = input("\nCole seu access token: ").strip()
        if not access_token:
            print("❌ Token inválido. Testando apenas endpoints públicos.")
            access_token = None
    
    # Criar tester
    tester = MercadoLivreAPITester(access_token=access_token)
    
    # Configurar testes
    setup_tests(tester, access_token)
    
    # Aguardar confirmação
    print(f"\n✅ {tester.suite.total_tests} testes configurados.")
    print("\n🚀 Iniciando testes em 2 segundos...")
    time.sleep(2)
    
    # Executar testes
    tester.run_all_tests()
    
    # Salvar relatório
    report_path = "/home/ubuntu/markethub-crm-v2/tests/ml_test_report.json"
    report_data = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.suite.total_tests,
        "passed": tester.suite.passed_tests,
        "failed": tester.suite.failed_tests,
        "total_time": tester.suite.total_time,
        "avg_response_time": tester.suite.avg_response_time,
        "tests": [
            {
                "name": t.name,
                "endpoint": t.endpoint,
                "status": t.status,
                "response_time": t.response_time,
                "status_code": t.status_code,
                "error": t.error_message
            }
            for t in tester.suite.tests
        ]
    }
    
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Relatório salvo em: {report_path}")
    print()

if __name__ == "__main__":
    main()
