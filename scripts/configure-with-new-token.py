#!/usr/bin/env python3
"""
Script para configurar todas as variáveis de ambiente no Railway via API GraphQL
Usando o token Account Token recém-criado
"""
import requests
import json
import time

# Configurações
RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
ACCOUNT_TOKEN = "7a69b521-cc04-42c5-acdf-b38035e9b2cc"

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
                error_msg = result['errors'][0].get('message', 'Unknown error')
                print(f"❌ {name}: {error_msg}")
                return False
            else:
                print(f"✅ {name}")
                return True
        else:
            print(f"❌ {name}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

# Chaves JWT geradas anteriormente
JWT_SECRET = "8cFyy.c<^nk[<R[k6d0CG-r|?RrRhtL*nfUs(=uDt3ulwQZCF{;k{r}JCZwF=hL["
JWT_REFRESH_SECRET = "1;R?-8oF?eM6Ri[p=Vd7yYhAajP#|&Rc(v9iE#5fXIVM.G*rzqoGjibb-M]6w{2S"
ENCRYPTION_KEY = "A)2UGo90I5<W!cS3-jjH=7wPeFSe{N7t"

# Variáveis de ambiente para configurar
env_vars = {
    "NODE_ENV": "production",
    "PORT": "5000",
    "DATABASE_URL": "postgresql://postgres:mYTbmqwLdcYxPOvfMgzPjXQWZYWxfNfk@mainline.proxy.rlwy.net:27779/railway",
    "JWT_SECRET": JWT_SECRET,
    "JWT_REFRESH_SECRET": JWT_REFRESH_SECRET,
    "JWT_EXPIRES_IN": "7d",
    "JWT_REFRESH_EXPIRES_IN": "30d",
    "ML_CLIENT_ID": "7719573488458",
    "ML_CLIENT_SECRET": "mxaqy7Emv46WNUA9K9nc3s1LPaVPR6RD",
    "ML_REDIRECT_URI": "https://markethub-crm-v2-production.up.railway.app/api/mercadolivre/callback",
    "ENCRYPTION_KEY": ENCRYPTION_KEY,
    "CORS_ORIGIN": "https://markethub-crm-v2-production.up.railway.app",
    "EMAIL_FROM": "noreply@markethub.com",
}

print("╔" + "═" * 78 + "╗")
print("║" + " " * 20 + "CONFIGURANDO VARIÁVEIS NO RAILWAY" + " " * 25 + "║")
print("╚" + "═" * 78 + "╝")
print()
print(f"📦 Projeto: markethub-crm-v2")
print(f"🌍 Ambiente: production")
print(f"📊 Total de variáveis: {len(env_vars)}")
print()
print("─" * 80)
print()

success_count = 0
error_count = 0

for i, (name, value) in enumerate(env_vars.items(), 1):
    print(f"[{i:2d}/{len(env_vars)}] ", end="")
    
    if upsert_variable(name, value):
        success_count += 1
    else:
        error_count += 1
    
    # Pequeno delay para não sobrecarregar a API
    time.sleep(0.3)

print()
print("─" * 80)
print()
print(f"✅ Sucesso: {success_count}/{len(env_vars)}")
print(f"❌ Erros: {error_count}/{len(env_vars)}")
print()

if error_count == 0:
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 28 + "🎉 CONFIGURAÇÃO COMPLETA! 🎉" + " " * 23 + "║")
    print("╚" + "═" * 78 + "╝")
    print()
    print("📋 PRÓXIMOS PASSOS:")
    print()
    print("1. ⏳ Railway iniciará redeploy automático (2-5 minutos)")
    print("2. 👀 Acompanhe: https://railway.app/project/1e0fbe42-f6f5-4e92-a3f7-b2f1f5c7f3d5")
    print("3. 🧪 Após deploy, teste:")
    print("   • Health: https://markethub-crm-v2-production.up.railway.app/api/health")
    print("   • Status: https://markethub-crm-v2-production.up.railway.app/system-status")
    print()
else:
    print("⚠️  Algumas variáveis não foram configuradas.")
    print("   Verifique os erros acima.")
    print()

print("─" * 80)
