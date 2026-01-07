import XLSX from 'xlsx';
import { pool } from '../db';

/**
 * Serviço completo de importação de planilhas para todos os módulos do MarketHub
 * Suporta: Produtos, Pedidos, Clientes, Vendas, Estoque, Análise Financeira
 */

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export class SpreadsheetImportService {
  /**
   * Importar produtos de planilha
   */
  async importProdutos(filePath: string, tenantId: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      updated: 0,
      errors: [],
      warnings: []
    };

    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rowNumber = i + 2; // +2 porque linha 1 é cabeçalho

        try {
          // Validar campos obrigatórios
          if (!row.sku || !row.nome) {
            result.errors.push({
              row: rowNumber,
              field: 'sku/nome',
              message: 'SKU e Nome são obrigatórios'
            });
            continue;
          }

          // Verificar se produto já existe
          const existingProduct = await pool.query(
            'SELECT id FROM products WHERE sku = $1 AND tenant_id = $2',
            [row.sku, tenantId]
          );

          if (existingProduct.rows.length > 0) {
            // Atualizar produto existente
            await pool.query(
              `UPDATE products SET 
                nome = $1, 
                preco_venda = $2, 
                preco_custo = $3,
                estoque_atual = $4,
                estoque_minimo = $5,
                categoria = $6,
                descricao = $7,
                peso = $8,
                altura = $9,
                largura = $10,
                comprimento = $11,
                updated_at = NOW()
              WHERE sku = $12 AND tenant_id = $13`,
              [
                row.nome,
                row.preco_venda || 0,
                row.preco_custo || 0,
                row.estoque_atual || 0,
                row.estoque_minimo || 10,
                row.categoria || 'Geral',
                row.descricao || '',
                row.peso || 0,
                row.altura || 0,
                row.largura || 0,
                row.comprimento || 0,
                row.sku,
                tenantId
              ]
            );
            result.updated++;
          } else {
            // Inserir novo produto
            await pool.query(
              `INSERT INTO products (
                tenant_id, sku, nome, preco_venda, preco_custo,
                estoque_atual, estoque_minimo, categoria, descricao,
                peso, altura, largura, comprimento, status, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ativo', NOW(), NOW())`,
              [
                tenantId,
                row.sku,
                row.nome,
                row.preco_venda || 0,
                row.preco_custo || 0,
                row.estoque_atual || 0,
                row.estoque_minimo || 10,
                row.categoria || 'Geral',
                row.descricao || '',
                row.peso || 0,
                row.altura || 0,
                row.largura || 0,
                row.comprimento || 0
              ]
            );
            result.imported++;
          }

          // Avisos para campos opcionais
          if (!row.categoria) {
            result.warnings.push({
              row: rowNumber,
              field: 'categoria',
              message: 'Categoria não informada, usando "Geral"'
            });
          }
        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            field: 'geral',
            message: error.message
          });
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error: any) {
      result.errors.push({
        row: 0,
        field: 'arquivo',
        message: `Erro ao processar arquivo: ${error.message}`
      });
      return result;
    }
  }

  /**
   * Importar vendas/pedidos do Mercado Livre de planilha
   */
  async importVendasML(filePath: string, tenantId: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      updated: 0,
      errors: [],
      warnings: []
    };

    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rowNumber = i + 2;

        try {
          // Validar campos obrigatórios
          if (!row.order_id || !row.sku) {
            result.errors.push({
              row: rowNumber,
              field: 'order_id/sku',
              message: 'Order ID e SKU são obrigatórios'
            });
            continue;
          }

          // Calcular comissão do ML (11% a 19% dependendo da categoria)
          const comissaoML = row.comissao_ml || this.calcularComissaoML(row.categoria, row.preco_venda);
          
          // Calcular custo de frete
          const custoFrete = row.preco_venda >= 79.90 ? 0 : (row.custo_frete || 0);

          // Verificar se pedido já existe
          const existingOrder = await pool.query(
            'SELECT id FROM orders WHERE external_id = $1 AND tenant_id = $2',
            [row.order_id, tenantId]
          );

          if (existingOrder.rows.length > 0) {
            result.warnings.push({
              row: rowNumber,
              field: 'order_id',
              message: 'Pedido já existe, pulando'
            });
            continue;
          }

          // Inserir pedido
          await pool.query(
            `INSERT INTO orders (
              tenant_id, external_id, marketplace, sku, quantidade,
              preco_venda, custo_produto, comissao_marketplace, custo_frete,
              lucro_liquido, status, data_venda, created_at
            ) VALUES ($1, $2, 'mercadolivre', $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
            [
              tenantId,
              row.order_id,
              row.sku,
              row.quantidade || 1,
              row.preco_venda,
              row.custo_produto || 0,
              comissaoML,
              custoFrete,
              row.preco_venda - (row.custo_produto || 0) - comissaoML - custoFrete,
              row.status || 'paid',
              row.data_venda || new Date()
            ]
          );
          result.imported++;

        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            field: 'geral',
            message: error.message
          });
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error: any) {
      result.errors.push({
        row: 0,
        field: 'arquivo',
        message: `Erro ao processar arquivo: ${error.message}`
      });
      return result;
    }
  }

  /**
   * Calcular comissão do Mercado Livre baseado na categoria
   */
  private calcularComissaoML(categoria: string, precoVenda: number): number {
    const taxas: Record<string, number> = {
      'Eletrônicos': 0.19,
      'Moda': 0.15,
      'Casa': 0.13,
      'Esportes': 0.14,
      'Livros': 0.11,
      'default': 0.15
    };

    const taxa = taxas[categoria] || taxas['default'];
    return precoVenda * taxa;
  }

  /**
   * Importar análise financeira de planilha
   */
  async importAnaliseFinanceira(filePath: string, tenantId: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      updated: 0,
      errors: [],
      warnings: []
    };

    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rowNumber = i + 2;

        try {
          // Validar campos obrigatórios
          if (!row.data || !row.tipo || !row.valor) {
            result.errors.push({
              row: rowNumber,
              field: 'data/tipo/valor',
              message: 'Data, Tipo e Valor são obrigatórios'
            });
            continue;
          }

          // Inserir transação financeira
          await pool.query(
            `INSERT INTO financial_transactions (
              tenant_id, data, tipo, categoria, descricao, valor, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              tenantId,
              row.data,
              row.tipo, // 'receita' | 'despesa' | 'opex' | 'custo_fixo' | 'custo_variavel'
              row.categoria || 'Geral',
              row.descricao || '',
              row.valor
            ]
          );
          result.imported++;

        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            field: 'geral',
            message: error.message
          });
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error: any) {
      result.errors.push({
        row: 0,
        field: 'arquivo',
        message: `Erro ao processar arquivo: ${error.message}`
      });
      return result;
    }
  }

  /**
   * Importar clientes de planilha
   */
  async importClientes(filePath: string, tenantId: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      updated: 0,
      errors: [],
      warnings: []
    };

    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rowNumber = i + 2;

        try {
          // Validar campos obrigatórios
          if (!row.email && !row.cpf) {
            result.errors.push({
              row: rowNumber,
              field: 'email/cpf',
              message: 'Email ou CPF é obrigatório'
            });
            continue;
          }

          // Verificar se cliente já existe
          const existingClient = await pool.query(
            'SELECT id FROM clients WHERE (email = $1 OR cpf = $2) AND tenant_id = $3',
            [row.email, row.cpf, tenantId]
          );

          if (existingClient.rows.length > 0) {
            // Atualizar cliente existente
            await pool.query(
              `UPDATE clients SET 
                nome = $1, 
                email = $2, 
                telefone = $3,
                cpf = $4,
                endereco = $5,
                cidade = $6,
                estado = $7,
                cep = $8,
                updated_at = NOW()
              WHERE id = $9`,
              [
                row.nome,
                row.email,
                row.telefone,
                row.cpf,
                row.endereco,
                row.cidade,
                row.estado,
                row.cep,
                existingClient.rows[0].id
              ]
            );
            result.updated++;
          } else {
            // Inserir novo cliente
            await pool.query(
              `INSERT INTO clients (
                tenant_id, nome, email, telefone, cpf, endereco,
                cidade, estado, cep, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
              [
                tenantId,
                row.nome,
                row.email,
                row.telefone,
                row.cpf,
                row.endereco,
                row.cidade,
                row.estado,
                row.cep
              ]
            );
            result.imported++;
          }

        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            field: 'geral',
            message: error.message
          });
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error: any) {
      result.errors.push({
        row: 0,
        field: 'arquivo',
        message: `Erro ao processar arquivo: ${error.message}`
      });
      return result;
    }
  }
}

export default SpreadsheetImportService;
