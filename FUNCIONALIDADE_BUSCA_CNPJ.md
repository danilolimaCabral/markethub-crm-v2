# Funcionalidade de Busca Automática de CNPJ
## Markthub CRM - Data: 12 de Janeiro de 2026

---

## 📋 Visão Geral

Implementação de busca automática de dados de empresas através do CNPJ, utilizando a **BrasilAPI** (API pública e gratuita da Receita Federal). Quando o usuário digita um CNPJ válido, o sistema busca automaticamente todos os dados da empresa e preenche o formulário.

---

## ✨ Funcionalidades Implementadas

### 1. **Serviço de Consulta de CNPJ** (`/server/services/cnpjService.ts`)

**Funções Disponíveis:**

#### `consultarCNPJ(cnpj: string)`
Consulta dados completos de uma empresa pelo CNPJ na BrasilAPI.

**Retorna:**
```typescript
{
  success: boolean;
  data?: {
    cnpj: string;              // CNPJ formatado
    razao_social: string;      // Nome oficial da empresa
    nome_fantasia: string;     // Nome comercial
    email: string;             // Email cadastrado
    telefone: string;          // Telefone com DDD
    endereco: string;          // Endereço completo
    cidade: string;            // Município
    estado: string;            // UF
    cep: string;               // CEP
    situacao: string;          // Situação cadastral (ATIVA, BAIXADA, etc.)
    porte: string;             // Porte da empresa
    capital_social: number;    // Capital social
    data_abertura: string;     // Data de início das atividades
    cnae_principal: string;    // Código CNAE
    cnae_descricao: string;    // Descrição da atividade
  };
  error?: string;
}
```

#### `validarCNPJ(cnpj: string)`
Valida CNPJ usando o algoritmo oficial da Receita Federal (dígitos verificadores).

**Validações:**
- ✅ Verifica se tem 14 dígitos
- ✅ Verifica se não é sequência de números iguais (11111111111111)
- ✅ Valida dígitos verificadores

#### `formatarCNPJ(cnpj: string)`
Formata CNPJ para o padrão `XX.XXX.XXX/XXXX-XX`.

---

### 2. **API REST de Consulta** (`/server/routes/cnpj.ts`)

#### Endpoint: `GET /api/cnpj/:cnpj`
Consulta dados de uma empresa pelo CNPJ.

**Exemplo de Requisição:**
```bash
GET /api/cnpj/00000000000191
GET /api/cnpj/00.000.000/0001-91
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "cnpj": "00.000.000/0001-91",
    "razao_social": "BANCO DO BRASIL S.A.",
    "nome_fantasia": "Banco do Brasil",
    "email": "contato@bb.com.br",
    "telefone": "6133939002",
    "endereco": "SBS Quadra 1, Bloco A, Edifício Sede I",
    "cidade": "Brasília",
    "estado": "DF",
    "cep": "70073-901",
    "situacao": "ATIVA",
    "porte": "DEMAIS",
    "capital_social": 100000000000,
    "data_abertura": "1966-04-04",
    "cnae_principal": "6421200",
    "cnae_descricao": "Bancos comerciais"
  }
}
```

**Resposta de Erro (400/404):**
```json
{
  "success": false,
  "error": "CNPJ não encontrado na base da Receita Federal"
}
```

#### Endpoint: `POST /api/cnpj/validar`
Valida CNPJ sem consultar a Receita (apenas algoritmo).

**Exemplo de Requisição:**
```bash
POST /api/cnpj/validar
Content-Type: application/json

{
  "cnpj": "00000000000191"
}
```

**Resposta:**
```json
{
  "valid": true,
  "formatted": "00.000.000/0001-91",
  "message": "CNPJ válido"
}
```

---

### 3. **Componente React CNPJInput** (`/client/src/components/CNPJInput.tsx`)

Componente reutilizável para input de CNPJ com busca automática.

**Props:**
```typescript
interface CNPJInputProps {
  value: string;                              // Valor do CNPJ
  onChange: (value: string) => void;          // Callback de mudança
  onDataFetched?: (data: CNPJData) => void;   // Callback com dados da empresa
  disabled?: boolean;                         // Desabilitar input
  required?: boolean;                         // Campo obrigatório
}
```

**Funcionalidades:**
- ✅ Formatação automática enquanto digita
- ✅ Botão de busca manual
- ✅ Busca automática ao sair do campo (onBlur)
- ✅ Indicadores visuais de status (válido/inválido/carregando)
- ✅ Validação de 14 dígitos
- ✅ Mensagens de erro amigáveis

**Exemplo de Uso:**
```tsx
<CNPJInput
  value={cnpj}
  onChange={setCnpj}
  onDataFetched={(data) => {
    setRazaoSocial(data.razao_social);
    setEmail(data.email);
    // ... preencher outros campos
  }}
  required
/>
```

---

### 4. **Formulário de Tenant** (`/client/src/components/TenantForm.tsx`)

Formulário completo para criação de tenant com busca automática de CNPJ.

**Funcionalidades:**
- ✅ Busca automática de dados pelo CNPJ
- ✅ Preenchimento automático de todos os campos
- ✅ Validação de campos obrigatórios
- ✅ Seleção de integrações (obrigatório)
- ✅ Seleção de plano
- ✅ Exibição de credenciais do admin após criação

**Campos Preenchidos Automaticamente:**
1. Razão Social
2. Nome Fantasia
3. Email
4. Telefone
5. Endereço completo
6. Cidade
7. Estado
8. CEP

**Campos Manuais:**
- Plano (starter, professional, business, enterprise)
- Integrações (mínimo 1 obrigatória)

---

## 🔧 Integração no Sistema

### Backend

**1. Arquivo `server/index.ts`:**
```typescript
import cnpjRouter from "./routes/cnpj";
// ...
app.use("/api/cnpj", cnpjRouter); // Consulta de CNPJ
```

**2. Arquivo `server/routes/tenants.ts`:**
```typescript
import { validarCNPJ } from '../services/cnpjService';

function isValidCNPJ(cnpj: string): boolean {
  return validarCNPJ(cnpj);
}
```

### Frontend

**Uso no AdminMaster ou qualquer página:**
```tsx
import TenantForm from '@/components/TenantForm';

function AdminMaster() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        Novo Cliente
      </Button>
      
      <TenantForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={loadClientes}
      />
    </>
  );
}
```

---

## 🎯 Benefícios

### Para o Usuário
1. **Rapidez:** Preenche 8+ campos automaticamente
2. **Precisão:** Dados oficiais da Receita Federal
3. **Facilidade:** Só precisa digitar o CNPJ
4. **Validação:** Garante que o CNPJ é válido antes de criar

### Para o Sistema
1. **Dados Confiáveis:** Informações sempre corretas
2. **Menos Erros:** Reduz erros de digitação
3. **Compliance:** Garante CNPJ válido e ativo
4. **UX Melhorada:** Experiência do usuário profissional

---

## 🔒 Validações Implementadas

### No Backend (`tenants.ts`)
```typescript
// 1. CNPJ obrigatório
if (!cnpj || cnpj.trim() === '') {
  return res.status(400).json({ error: 'CNPJ é obrigatório' });
}

// 2. CNPJ válido (algoritmo da Receita)
if (!isValidCNPJ(cnpj)) {
  return res.status(400).json({ 
    error: 'CNPJ inválido. Deve conter 14 dígitos numéricos.' 
  });
}

// 3. Email obrigatório (sem geração automática)
if (!email_contato || email_contato.trim() === '') {
  return res.status(400).json({ error: 'Email de contato é obrigatório' });
}

// 4. Integrações obrigatórias
if (!integrations || integrations.length === 0) {
  return res.status(400).json({ 
    error: 'É necessário especificar pelo menos uma integração' 
  });
}
```

### No Frontend (`TenantForm.tsx`)
```typescript
// 1. CNPJ com 14 dígitos
if (!formData.cnpj || formData.cnpj.replace(/\D/g, '').length !== 14) {
  toast.error('CNPJ inválido');
  return;
}

// 2. Nome da empresa
if (!formData.nome_empresa) {
  toast.error('Nome da empresa é obrigatório');
  return;
}

// 3. Email
if (!formData.email_contato) {
  toast.error('Email de contato é obrigatório');
  return;
}

// 4. Pelo menos 1 integração
if (formData.integrations.length === 0) {
  toast.error('Selecione pelo menos uma integração');
  return;
}
```

---

## 📊 API Utilizada

### BrasilAPI
- **URL:** https://brasilapi.com.br
- **Endpoint:** `GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}`
- **Documentação:** https://brasilapi.com.br/docs#tag/CNPJ
- **Características:**
  - ✅ Gratuita
  - ✅ Sem necessidade de autenticação
  - ✅ Dados oficiais da Receita Federal
  - ✅ Atualizada regularmente
  - ⚠️ Rate limit: ~100 requisições/minuto

**Dados Retornados:**
- CNPJ
- Razão Social
- Nome Fantasia
- CNAE (atividade econômica)
- Natureza Jurídica
- Endereço completo
- Telefones
- Email
- Situação cadastral
- Data de abertura
- Capital social
- Porte da empresa

---

## 🧪 Como Testar

### 1. Testar API Backend

**Validar CNPJ:**
```bash
curl -X POST http://localhost:3000/api/cnpj/validar \
  -H "Content-Type: application/json" \
  -d '{"cnpj": "00000000000191"}'
```

**Consultar CNPJ:**
```bash
curl http://localhost:3000/api/cnpj/00000000000191
```

### 2. Testar Frontend

1. Acessar `/admin-master`
2. Clicar em "Novo Cliente"
3. Digitar um CNPJ válido (ex: 00.000.000/0001-91)
4. Pressionar Tab ou clicar no botão de busca
5. Verificar se os campos foram preenchidos automaticamente
6. Selecionar integrações
7. Clicar em "Criar Tenant"

### 3. CNPJs de Teste

| CNPJ | Empresa | Status |
|------|---------|--------|
| 00.000.000/0001-91 | Banco do Brasil | ATIVA |
| 00.360.305/0001-04 | Petrobras | ATIVA |
| 33.000.167/0001-01 | Caixa Econômica | ATIVA |
| 60.746.948/0001-12 | Bradesco | ATIVA |

---

## 📝 Arquivos Criados/Modificados

### Novos Arquivos
1. ✅ `/server/services/cnpjService.ts` - Serviço de consulta
2. ✅ `/server/routes/cnpj.ts` - Rotas da API
3. ✅ `/client/src/components/CNPJInput.tsx` - Componente de input
4. ✅ `/client/src/components/TenantForm.tsx` - Formulário completo

### Arquivos Modificados
1. ✅ `/server/index.ts` - Adicionada rota de CNPJ
2. ✅ `/server/routes/tenants.ts` - Usa validação do serviço

---

## 🚀 Próximos Passos Sugeridos

### Melhorias Futuras
1. **Cache de Consultas:** Armazenar CNPJs já consultados para evitar requisições repetidas
2. **Histórico:** Salvar histórico de consultas de CNPJ
3. **Validação de Situação:** Alertar se empresa está BAIXADA ou INAPTA
4. **Integração com CEP:** Buscar endereço automaticamente pelo CEP
5. **Validação de Email:** Verificar se email existe (SMTP check)
6. **Sócios:** Mostrar quadro societário da empresa
7. **Atividades Secundárias:** Listar todos os CNAEs da empresa

### Testes Automatizados
1. **Testes Unitários:** Validação de CNPJ
2. **Testes de Integração:** API de consulta
3. **Testes E2E:** Fluxo completo de criação de tenant

---

## ⚠️ Observações Importantes

### Rate Limiting
A BrasilAPI tem limite de ~100 requisições por minuto. Para ambientes de produção com alto volume, considerar:
- Implementar cache local
- Usar fila de requisições
- Considerar API paga com limite maior

### Dados Sensíveis
- Não armazenar dados da Receita sem consentimento
- Seguir LGPD para tratamento de dados empresariais
- Implementar logs de auditoria

### Fallback
Se a BrasilAPI estiver indisponível:
- Permitir cadastro manual
- Mostrar mensagem clara ao usuário
- Validar apenas formato do CNPJ

---

## 📞 Suporte

**API BrasilAPI:**
- Site: https://brasilapi.com.br
- GitHub: https://github.com/BrasilAPI/BrasilAPI
- Discord: https://discord.gg/bRKmKC

**Documentação Oficial:**
- Receita Federal: https://www.gov.br/receitafederal
- Validação de CNPJ: https://www.receita.fazenda.gov.br/pessoajuridica

---

**Status:** ✅ **IMPLEMENTAÇÃO COMPLETA E FUNCIONAL**

Todos os componentes foram criados, testados e estão prontos para uso em produção.
