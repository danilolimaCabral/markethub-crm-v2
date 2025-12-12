#!/usr/bin/env python3
"""
Script para configurar todas as variáveis de ambiente no Railway via API GraphQL
Usando Account Token com permissões completas
"""
import requests
import json
import time

# Configurações
RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
ACCOUNT_TOKEN = "914c4810-8a37-4135-856d-68ae4fbd1cae"

# IDs do projeto
PROJECT_ID = "1e0fbe42-f6f5-4e92-a3f7-b2f1f5c7f3d5"
ENVIRONMENT_ID = "2e6e6cdb-5cc9-42cf-a393-0a635b4a6579"
SERVICE_ID = "6bb0d773-527a-4929-ba29-c3c609795d5b"

headers = {
    "Authorization": f"Bearer {ACCOUNT_TOKEN}",
    "Content-Type": "application/json"
}

def upsert_variable(name, value):
    """Cria ou atualiza uma variável de ambiente"""
    mutation = """
    mutation variableUpsert($input: VariableUpsertInput!) {
      variableUpsert(input: $input)
    }
    """
    
    variables = {
        "input": {
            "projectId": PROJECT_ID,
            "environmentId": ENVIRONMENT_ID,
            "serviceId": SERVICE_ID,
            "name": name,
            "value": value
        }
    }
    
    payload = {
        "query": mutation,
        "variables": variables
    }
    
    try:
        response = requests.post(RAILWAY_API_URL, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if "errors" in result:
                print(f"❌ Erro ao configurar {name}: {result['errors'][0]['message']}")
                return False
            else:
                print(f"✅ {name} configurado com sucesso")
                return True
        else:
            print(f"❌ Erro HTTP {response.status_code} ao configurar {name}")
            return False
    except Exception as e:
        print(f"❌ Exceção ao configurar {name}: {str(e)}")
        return False

# Chaves JWT geradas anteriormente
JWT_SECRET = "8cFyy.c<^nk[<R[k6d0CG-r|?RrRhtL*nfUs(=uDt3ulwQZCF{;k{r}JCZwF=hL["
JWT_REFRESH_SECRET = "1;R?-8oF?eM6Ri[p=Vd7yYhAajP#|&Rc(v9iE#5fXIVM.G*rzqoGjibb-M]6w{2S"
ENCRYPTION_KEY = "A)2UGo90I5<W!cS3-jjH=7wPeFSe{N7t"

# Variáveis de ambiente para configurar
env_vars = {
    # Node.js e ambiente
    "NODE_ENV": "production",
    "PORT": "5000",
    
    # Database (PostgreSQL do Railway)
    "DATABASE_URL": "postgresql://postgres:mYTbmqwLdcYxPOvfMgzPjXQWZYWxfNfk@mainline.proxy.rlwy.net:27779/railway",
    
    # JWT
    "JWT_SECRET": JWT_SECRET,
    "JWT_REFRESH_SECRET": JWT_REFRESH_SECRET,
    "JWT_EXPIRES_IN": "7d",
    "JWT_REFRESH_EXPIRES_IN": "30d",
    
    # Mercado Livre
    "ML_CLIENT_ID": "7719573488458",
    "ML_CLIENT_SECRET": "mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD",
    "ML_REDIRECT_URI": "https://markethub-crm-v2-production.up.railway.app/api/mercadolivre/callback",
    
    # Encryption
    "ENCRYPTION_KEY": ENCRYPTION_KEY,
    
    # CORS
    "CORS_ORIGIN": "https://markethub-crm-v2-production.up.railway.app",
    
    # Email
    "EMAIL_FROM": "noreply@markethub.com",
}

print("=" * 80)
print("CONFIGURANDO VARIÁVEIS DE AMBIENTE NO RAILWAY")
print("=" * 80)
print(f"Project ID: {PROJECT_ID}")
print(f"Environment: production ({ENVIRONMENT_ID})")
print(f"Service: markethub-crm-v2 ({SERVICE_ID})")
print(f"Total de variáveis: {len(env_vars)}")
print("=" * 80)
print()

success_count = 0
error_count = 0
errors_list = []

for i, (name, value) in enumerate(env_vars.items(), 1):
    print(f"[{i}/{len(env_vars)}] Configurando {name}...", end=" ")
    
    if upsert_variable(name, value):
        success_count += 1
    else:
        error_count += 1
        errors_list.append(name)
    
    # Pequeno delay para não sobrecarregar a API
    time.sleep(0.5)

print()
print("=" * 80)
print("RESUMO DA CONFIGURAÇÃO")
print("=" * 80)
print(f"✅ Configuradas com sucesso: {success_count}/{len(env_vars)}")
print(f"❌ Erros: {error_count}/{len(env_vars)}")

if errors_list:
    print()
    print("Variáveis com erro:")
    for var in errors_list:
        print(f"  - {var}")

print()
print("=" * 80)

if error_count == 0:
    print("🎉 SUCESSO! Todas as variáveis foram configuradas!")
    print()
    print("PRÓXIMOS PASSOS:")
    print("1. O Railway iniciará redeploy automático (aguarde 2-5 minutos)")
    print("2. Acompanhe em: https://railway.app/project/1e0fbe42-f6f5-4e92-a3f7-b2f1f5c7f3d5")
    print("3. Após deploy, teste:")
    print("   - Health: https://markethub-crm-v2-production.up.railway.app/api/health")
    print("   - Status: https://markethub-crm-v2-production.up.railway.app/system-status")
else:
    print("⚠️  Algumas variáveis não foram configuradas.")
    print("Verifique os erros acima e tente novamente.")

print("=" * 80)
