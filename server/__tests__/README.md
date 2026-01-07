# 🧪 Testes Automatizados - MarketHub CRM v2

Este diretório contém a suíte de testes automatizados para o backend do sistema MarketHub CRM v2.

## 📋 Estrutura

```
__tests__/
├── setup.ts                          # Configuração global dos testes
├── auth.test.ts                      # Testes de autenticação
├── products.test.ts                  # Testes de produtos
└── spreadsheet-validation.test.ts    # Testes de validação de planilhas
```

## 🚀 Como Executar

### Executar todos os testes

```bash
pnpm test
```

### Executar testes específicos

```bash
# Apenas testes de autenticação
pnpm test auth

# Apenas testes de produtos
pnpm test products

# Apenas testes de validação de planilhas
pnpm test spreadsheet
```

### Executar com cobertura de código

```bash
pnpm test:coverage
```

### Modo watch (desenvolvimento)

```bash
pnpm test:watch
```

## 🔧 Configuração

Os testes utilizam as seguintes ferramentas:

- **Vitest:** Framework de testes rápido e moderno
- **Supertest:** Biblioteca para testar APIs HTTP
- **PostgreSQL:** Banco de dados de teste

### Variáveis de Ambiente

Crie um arquivo `.env.test` na raiz do projeto com as seguintes variáveis:

```env
NODE_ENV=test
DATABASE_URL=postgresql://user:password@localhost:5432/markethub_test
JWT_SECRET=test-secret-key
```

## 📝 Convenções

### Nomenclatura de Testes

- Use `describe` para agrupar testes relacionados
- Use `it` ou `test` para casos de teste individuais
- Nomes descritivos em português: "deve fazer X quando Y"

### Estrutura de um Teste

```typescript
describe('Nome do Módulo', () => {
  beforeAll(async () => {
    // Configuração antes de todos os testes
  });

  afterAll(async () => {
    // Limpeza após todos os testes
  });

  describe('Funcionalidade Específica', () => {
    it('deve comportar-se de forma esperada', async () => {
      // Arrange (preparar)
      const input = { /* ... */ };

      // Act (executar)
      const result = await someFunction(input);

      // Assert (verificar)
      expect(result).toBe(expected);
    });
  });
});
```

## ✅ Cobertura de Testes

Os testes cobrem as seguintes áreas:

### Autenticação (`auth.test.ts`)
- ✅ Registro de novos usuários
- ✅ Login com credenciais válidas
- ✅ Validação de tokens JWT
- ✅ Proteção de rotas autenticadas
- ✅ Tratamento de erros (credenciais inválidas, email duplicado)

### Produtos (`products.test.ts`)
- ✅ Criação de produtos
- ✅ Listagem de produtos
- ✅ Busca de produto por ID
- ✅ Atualização de produtos
- ✅ Exclusão de produtos (soft delete)
- ✅ Isolamento por tenant
- ✅ Validação de campos obrigatórios

### Validação de Planilhas (`spreadsheet-validation.test.ts`)
- ✅ Download de templates (produtos, pedidos, clientes)
- ✅ Validação de planilhas
- ✅ Tratamento de erros de formato
- ✅ Proteção de rotas autenticadas

## 🎯 Próximos Passos

- [ ] Adicionar testes para rotas de pedidos
- [ ] Adicionar testes para rotas de clientes
- [ ] Adicionar testes para integração com Mercado Livre
- [ ] Adicionar testes para webhooks
- [ ] Adicionar testes de integração E2E
- [ ] Melhorar cobertura de código para 80%+

## 🐛 Debugging

Para debugar testes específicos:

```bash
# Executar com logs detalhados
DEBUG=* pnpm test

# Executar um único teste
pnpm test -t "nome do teste"
```

## 📚 Recursos

- [Documentação do Vitest](https://vitest.dev/)
- [Documentação do Supertest](https://github.com/visionmedia/supertest)
- [Boas Práticas de Testes](https://testingjavascript.com/)
