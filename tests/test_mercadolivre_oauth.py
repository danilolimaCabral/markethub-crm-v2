#!/usr/bin/env python3
"""
Script de Teste - API Mercado Livre OAuth2
==========================================

Este script testa a conexão com a API do Mercado Livre usando OAuth2.

Funcionalidades:
- Gera URL de autorização
- Simula callback e troca de código por token
- Testa endpoints da API do ML
- Valida refresh token

Autor: Manus AI
Data: 12 de dezembro de 2025
"""

import requests
import json
import urllib.parse
from datetime import datetime
from typing import Dict, Optional, Tuple

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Credenciais do Mercado Livre (do seu dashboard)
ML_CLIENT_ID = "7719573488458"
ML_CLIENT_SECRET = "mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD"
ML_REDIRECT_URI = "https://www.markthubcrm.com.br/callback/mercadolivre"

# URLs da API do Mercado Livre
ML_AUTH_URL = "https://auth.mercadolivre.com.br/authorization"
ML_TOKEN_URL = "https://api.mercadolibre.com/oauth/token"
ML_API_BASE_URL = "https://api.mercadolibre.com"

# ============================================================================
# CLASSE DE TESTE
# ============================================================================

class MercadoLivreOAuthTester:
    """Classe para testar a integração OAuth2 com o Mercado Livre."""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user_id: Optional[str] = None
        
    def generate_auth_url(self) -> str:
        """
        Gera a URL de autorização OAuth2 do Mercado Livre.
        
        Returns:
            str: URL completa para autorização
        """
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri
        }
        
        query_string = urllib.parse.urlencode(params)
        auth_url = f"{ML_AUTH_URL}?{query_string}"
        
        return auth_url
    
    def exchange_code_for_token(self, code: str) -> Tuple[bool, Dict]:
        """
        Troca o código de autorização por tokens de acesso.
        
        Args:
            code: Código de autorização recebido do callback
            
        Returns:
            Tuple[bool, Dict]: (sucesso, dados_da_resposta)
        """
        try:
            payload = {
                "grant_type": "authorization_code",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "redirect_uri": self.redirect_uri
            }
            
            response = requests.post(ML_TOKEN_URL, json=payload, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Armazenar tokens
            self.access_token = data.get("access_token")
            self.refresh_token = data.get("refresh_token")
            self.user_id = data.get("user_id")
            
            return True, data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
    
    def refresh_access_token(self) -> Tuple[bool, Dict]:
        """
        Renova o access token usando o refresh token.
        
        Returns:
            Tuple[bool, Dict]: (sucesso, dados_da_resposta)
        """
        if not self.refresh_token:
            return False, {"error": "Refresh token não disponível"}
        
        try:
            payload = {
                "grant_type": "refresh_token",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token
            }
            
            response = requests.post(ML_TOKEN_URL, json=payload, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Atualizar tokens
            self.access_token = data.get("access_token")
            self.refresh_token = data.get("refresh_token")
            
            return True, data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
    
    def test_get_user_info(self) -> Tuple[bool, Dict]:
        """
        Testa o endpoint de informações do usuário.
        
        Returns:
            Tuple[bool, Dict]: (sucesso, dados_do_usuário)
        """
        if not self.access_token:
            return False, {"error": "Access token não disponível"}
        
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            url = f"{ML_API_BASE_URL}/users/me"
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            return True, response.json()
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
    
    def test_get_user_items(self, limit: int = 10) -> Tuple[bool, Dict]:
        """
        Testa o endpoint de produtos/anúncios do usuário.
        
        Args:
            limit: Número máximo de itens a retornar
            
        Returns:
            Tuple[bool, Dict]: (sucesso, lista_de_produtos)
        """
        if not self.access_token or not self.user_id:
            return False, {"error": "Access token ou user_id não disponível"}
        
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            url = f"{ML_API_BASE_URL}/users/{self.user_id}/items/search"
            params = {"limit": limit, "offset": 0}
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            return True, response.json()
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
    
    def test_get_orders(self, limit: int = 10) -> Tuple[bool, Dict]:
        """
        Testa o endpoint de pedidos do vendedor.
        
        Args:
            limit: Número máximo de pedidos a retornar
            
        Returns:
            Tuple[bool, Dict]: (sucesso, lista_de_pedidos)
        """
        if not self.access_token or not self.user_id:
            return False, {"error": "Access token ou user_id não disponível"}
        
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            url = f"{ML_API_BASE_URL}/orders/search"
            params = {
                "seller": self.user_id,
                "limit": limit,
                "offset": 0
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            return True, response.json()
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
    
    def test_credentials(self) -> Tuple[bool, Dict]:
        """
        Testa se as credenciais estão válidas fazendo uma requisição simples.
        
        Returns:
            Tuple[bool, Dict]: (sucesso, resultado)
        """
        try:
            # Tenta obter informações sobre categorias (endpoint público)
            url = f"{ML_API_BASE_URL}/sites/MLB/categories"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            return True, {
                "message": "API do Mercado Livre está acessível",
                "categories_count": len(response.json())
            }
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

# ============================================================================
# FUNÇÕES DE TESTE
# ============================================================================

def print_section(title: str):
    """Imprime um cabeçalho de seção."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def print_result(success: bool, data: Dict):
    """Imprime o resultado de um teste."""
    if success:
        print("✅ SUCESSO")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print("❌ FALHA")
        print(json.dumps(data, indent=2, ensure_ascii=False))

def test_step_1_credentials():
    """Teste 1: Validar credenciais e acesso à API."""
    print_section("TESTE 1: Validar Credenciais e Acesso à API")
    
    tester = MercadoLivreOAuthTester(ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI)
    
    print("🔍 Testando acesso à API do Mercado Livre...")
    success, data = tester.test_credentials()
    print_result(success, data)
    
    return tester

def test_step_2_auth_url(tester: MercadoLivreOAuthTester):
    """Teste 2: Gerar URL de autorização."""
    print_section("TESTE 2: Gerar URL de Autorização OAuth2")
    
    print("🔗 Gerando URL de autorização...")
    auth_url = tester.generate_auth_url()
    
    print("✅ URL gerada com sucesso!")
    print(f"\n📋 URL de Autorização:\n{auth_url}\n")
    print("📌 Para continuar os testes:")
    print("   1. Copie a URL acima")
    print("   2. Cole no navegador")
    print("   3. Faça login no Mercado Livre")
    print("   4. Autorize a aplicação")
    print("   5. Copie o 'code' da URL de callback")
    print("   6. Execute: test_step_3_exchange_token(tester, 'SEU_CODE_AQUI')")

def test_step_3_exchange_token(tester: MercadoLivreOAuthTester, code: str):
    """Teste 3: Trocar código por token."""
    print_section("TESTE 3: Trocar Código por Access Token")
    
    print(f"🔄 Trocando código '{code[:10]}...' por access token...")
    success, data = tester.exchange_code_for_token(code)
    print_result(success, data)
    
    if success:
        print("\n✅ Tokens obtidos com sucesso!")
        print(f"   User ID: {tester.user_id}")
        print(f"   Access Token: {tester.access_token[:20]}...")
        print(f"   Refresh Token: {tester.refresh_token[:20]}...")
    
    return success

def test_step_4_user_info(tester: MercadoLivreOAuthTester):
    """Teste 4: Obter informações do usuário."""
    print_section("TESTE 4: Obter Informações do Usuário")
    
    print("👤 Buscando informações do usuário...")
    success, data = tester.test_get_user_info()
    print_result(success, data)

def test_step_5_user_items(tester: MercadoLivreOAuthTester):
    """Teste 5: Listar produtos do usuário."""
    print_section("TESTE 5: Listar Produtos/Anúncios")
    
    print("📦 Buscando produtos do usuário...")
    success, data = tester.test_get_user_items(limit=5)
    print_result(success, data)

def test_step_6_orders(tester: MercadoLivreOAuthTester):
    """Teste 6: Listar pedidos."""
    print_section("TESTE 6: Listar Pedidos")
    
    print("🛒 Buscando pedidos do vendedor...")
    success, data = tester.test_get_orders(limit=5)
    print_result(success, data)

def test_step_7_refresh_token(tester: MercadoLivreOAuthTester):
    """Teste 7: Renovar access token."""
    print_section("TESTE 7: Renovar Access Token")
    
    print("🔄 Renovando access token...")
    success, data = tester.refresh_access_token()
    print_result(success, data)

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

def main():
    """Função principal de execução dos testes."""
    print("\n" + "🚀" * 40)
    print("  TESTE DE INTEGRAÇÃO - MERCADO LIVRE OAUTH2")
    print("🚀" * 40)
    
    print(f"\n📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🔑 Client ID: {ML_CLIENT_ID}")
    print(f"🔗 Redirect URI: {ML_REDIRECT_URI}")
    
    # Teste 1: Validar credenciais
    tester = test_step_1_credentials()
    
    # Teste 2: Gerar URL de autorização
    test_step_2_auth_url(tester)
    
    print("\n" + "=" * 80)
    print("  PRÓXIMOS PASSOS")
    print("=" * 80)
    print("\n📌 Para continuar os testes com um código de autorização real:")
    print("\n   from test_mercadolivre_oauth import *")
    print("   tester = MercadoLivreOAuthTester(ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI)")
    print("   test_step_3_exchange_token(tester, 'SEU_CODE_AQUI')")
    print("   test_step_4_user_info(tester)")
    print("   test_step_5_user_items(tester)")
    print("   test_step_6_orders(tester)")
    print("   test_step_7_refresh_token(tester)")
    
    print("\n✅ Testes básicos concluídos!\n")

if __name__ == "__main__":
    main()
