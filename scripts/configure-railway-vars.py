#!/usr/bin/env python3
"""
Script para configurar todas as variáveis de ambiente no Railway via API GraphQL
"""
import requests
import json
import secrets
import string

# Configurações
RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
API_TOKEN = "d0389b5b-62aa-4f2e-ae3a-088c4d6c02dd"

# IDs do projeto
PROJECT_ID = "1e0fbe42-f6f5-4e92-a3f7-b2f1f5c7f3d5"
ENVIRONMENT_ID = "2e6e6cdb-5cc9-42cf-a393-0a635b4a6579"
SERVICE_ID = "6bb0d773-527a-4929-ba29-c3c609795d5b"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

def generate_jwt_secret(length=64):
    """Gera uma chave JWT segura"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+[]{}|;:,.<>?"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

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
    
    response = requests.post(RAILWAY_API_URL, headers=headers, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        if "errors" in result:
            print(f"❌ Erro ao configurar {name}: {result['errors']}")
            return False
        else:
            print(f"✅ {name} configurado com sucesso")
            return True
    else:
        print(f"❌ Erro HTTP {response.status_code} ao configurar {name}")
        return False

# Gerar chaves JWT
print("=" * 60)
print("GERANDO CHAVES JWT SEGURAS")
print("=" * 60)
JWT_SECRET = generate_jwt_secret(64)
JWT_REFRESH_SECRET = generate_jwt_secret(64)
ENCRYPTION_KEY = generate_jwt_secret(32)

print(f"JWT_SECRET: {JWT_SECRET[:20]}...")
print(f"JWT_REFRESH_SECRET: {JWT_REFRESH_SECRET[:20]}...")
print(f"ENCRYPTION_KEY: {ENCRYPTION_KEY[:20]}...")
print()

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
    
    # Redis (opcional - pode ser configurado depois)
    "REDIS_URL": "",
    
    # Stripe (opcional - pode ser configurado depois)
    "STRIPE_SECRET_KEY": "",
    "STRIPE_PUBLISHABLE_KEY": "",
    "STRIPE_WEBHOOK_SECRET": "",
    
    # Sentry (opcional - pode ser configurado depois)
    "SENTRY_DSN": "",
    
    # Email (opcional - pode ser configurado depois)
    "SMTP_HOST": "",
    "SMTP_PORT": "587",
    "SMTP_USER": "",
    "SMTP_PASS": "",
    "EMAIL_FROM": "noreply@markethub.com",
}

print("=" * 60)
print("CONFIGURANDO VARIÁVEIS DE AMBIENTE NO RAILWAY")
print("=" * 60)
print()

success_count = 0
error_count = 0

for name, value in env_vars.items():
    # Pular variáveis vazias (opcionais)
    if value == "":
        print(f"⏭️  {name} (pulado - opcional)")
        continue
    
    if upsert_variable(name, value):
        success_count += 1
    else:
        error_count += 1

print()
print("=" * 60)
print("RESUMO")
print("=" * 60)
print(f"✅ Configuradas com sucesso: {success_count}")
print(f"❌ Erros: {error_count}")
print()

if error_count == 0:
    print("🎉 Todas as variáveis foram configuradas com sucesso!")
    print()
    print("=" * 60)
    print("PRÓXIMOS PASSOS")
    print("=" * 60)
    print("1. O Railway irá fazer redeploy automaticamente")
    print("2. Aguarde alguns minutos para o deploy completar")
    print("3. Teste o endpoint: https://markethub-crm-v2-production.up.railway.app/api/health")
    print("4. Acesse o status: https://markethub-crm-v2-production.up.railway.app/system-status")
else:
    print("⚠️  Algumas variáveis não foram configuradas. Verifique os erros acima.")

# Salvar chaves geradas em arquivo
print()
print("=" * 60)
print("SALVANDO CHAVES GERADAS")
print("=" * 60)

keys_content = f"""# Chaves JWT Geradas para Markethub CRM V2
# Gerado em: {__import__('datetime').datetime.now().isoformat()}

JWT_SECRET={JWT_SECRET}
JWT_REFRESH_SECRET={JWT_REFRESH_SECRET}
ENCRYPTION_KEY={ENCRYPTION_KEY}

# IMPORTANTE: Guarde estas chaves em local seguro!
# Elas são necessárias para descriptografar dados e validar tokens.
"""

with open('/home/ubuntu/markethub-crm-v2/RAILWAY_JWT_KEYS.txt', 'w') as f:
    f.write(keys_content)

print("✅ Chaves salvas em: /home/ubuntu/markethub-crm-v2/RAILWAY_JWT_KEYS.txt")
print()
