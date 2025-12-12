#!/usr/bin/env python3
"""
Script para configurar variáveis de ambiente no Railway via API GraphQL
"""
import requests
import json
import secrets
import string

# Configurações
RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
API_TOKEN = "d0389b5b-62aa-4f2e-ae3a-088c4d6c02dd"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

def generate_jwt_secret(length=64):
    """Gera uma chave JWT segura"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+[]{}|;:,.<>?"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def graphql_query(query, variables=None):
    """Executa uma query GraphQL"""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    
    response = requests.post(RAILWAY_API_URL, headers=headers, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    return response.json()

# 1. Obter informações do projeto
print("=" * 60)
print("1. Obtendo informações do projeto...")
print("=" * 60)

# Tentar com projectToken query (se for um project token)
project_token_query = """
query {
  projectToken {
    projectId
    environmentId
  }
}
"""

result = graphql_query(project_token_query)
print(json.dumps(result, indent=2))

# Se não funcionar, tentar obter projetos
if "errors" in result:
    print("\nTentando obter lista de projetos...")
    projects_query = """
    query {
      projects {
        edges {
          node {
            id
            name
            environments {
              edges {
                node {
                  id
                  name
                }
              }
            }
            services {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
    """
    result = graphql_query(projects_query)
    print(json.dumps(result, indent=2))
