/**
 * Serviço de Validação de Planilhas
 * 
 * Processa planilhas Excel/CSV para validação de dados
 * Suporta múltiplas entidades: produtos, pedidos, clientes
 */

import * as XLSX from 'xlsx';
import { query } from '../db';

export interface ValidationResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data: any[];
  summary: {
    entity: string;
    fileName: string;
    processedAt: Date;
    duration: number;
  };
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  row: number;
  field: string;
  value: any;
  message: string;
}

export class SpreadsheetValidationService {
  /**
   * Processa arquivo de planilha e retorna resultado da validação
   */
  static async processSpreadsheet(
    buffer: Buffer,
    fileName: string,
    entityType: 'produtos' | 'pedidos' | 'clientes',
    options: {
      validateOnly?: boolean;
      tenant_id?: string;
      user_id?: string;
    } = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // Ler planilha
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: null,
        raw: false 
      });

      if (rawData.length === 0) {
        throw new Error('Planilha vazia ou sem dados válidos');
      }

      // Validar baseado no tipo de entidade
      let result: ValidationResult;
      
      switch (entityType) {
        case 'produtos':
          result = await this.validateProdutos(rawData, options);
          break;
        case 'pedidos':
          result = await this.validatePedidos(rawData, options);
          break;
        case 'clientes':
          result = await this.validateClientes(rawData, options);
          break;
        default:
          throw new Error(`Tipo de entidade não suportado: ${entityType}`);
      }

      // Adicionar informações de resumo
      result.summary = {
        entity: entityType,
        fileName,
        processedAt: new Date(),
        duration: Date.now() - startTime,
      };

      return result;
    } catch (error: any) {
      throw new Error(`Erro ao processar planilha: ${error.message}`);
    }
  }

  /**
   * Valida dados de produtos
   */
  private static async validateProdutos(
    data: any[],
    options: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validData: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque linha 1 é cabeçalho e arrays começam em 0
      let isValid = true;

      // Validar campos obrigatórios
      if (!row.nome || row.nome.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'nome',
          value: row.nome,
          message: 'Nome do produto é obrigatório',
          severity: 'error',
        });
        isValid = false;
      }

      if (!row.sku || row.sku.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'sku',
          value: row.sku,
          message: 'SKU é obrigatório',
          severity: 'error',
        });
        isValid = false;
      } else {
        // Verificar se SKU já existe
        const existingSku = await query(
          'SELECT id FROM produtos WHERE sku = $1 LIMIT 1',
          [row.sku]
        );
        
        if (existingSku.rows.length > 0) {
          warnings.push({
            row: rowNumber,
            field: 'sku',
            value: row.sku,
            message: 'SKU já existe no sistema - será atualizado se importar',
          });
        }
      }

      // Validar preço de venda
      const precoVenda = parseFloat(row.preco_venda || row.precoVenda || row['Preço de Venda'] || 0);
      if (isNaN(precoVenda) || precoVenda <= 0) {
        errors.push({
          row: rowNumber,
          field: 'preco_venda',
          value: row.preco_venda,
          message: 'Preço de venda inválido ou não informado',
          severity: 'error',
        });
        isValid = false;
      }

      // Validar preço de custo
      const precoCusto = parseFloat(row.preco_custo || row.precoCusto || row['Preço de Custo'] || 0);
      if (precoCusto < 0) {
        errors.push({
          row: rowNumber,
          field: 'preco_custo',
          value: row.preco_custo,
          message: 'Preço de custo não pode ser negativo',
          severity: 'error',
        });
        isValid = false;
      }

      // Avisar se preço de custo maior que preço de venda
      if (precoCusto > precoVenda) {
        warnings.push({
          row: rowNumber,
          field: 'margem',
          value: `Custo: ${precoCusto}, Venda: ${precoVenda}`,
          message: 'Preço de custo maior que preço de venda - margem negativa',
        });
      }

      // Validar estoque
      const estoque = parseInt(row.estoque_atual || row.estoque || row['Estoque'] || 0);
      if (isNaN(estoque) || estoque < 0) {
        errors.push({
          row: rowNumber,
          field: 'estoque_atual',
          value: row.estoque_atual,
          message: 'Estoque inválido',
          severity: 'error',
        });
        isValid = false;
      }

      // Normalizar dados
      if (isValid) {
        validData.push({
          nome: row.nome?.trim(),
          sku: row.sku?.trim(),
          categoria: row.categoria || row['Categoria'] || 'Geral',
          preco_venda: precoVenda,
          preco_custo: precoCusto,
          estoque_atual: estoque,
          estoque_minimo: parseInt(row.estoque_minimo || row['Estoque Mínimo'] || 5),
          status: row.status || 'ativo',
          marketplace: row.marketplace || row['Marketplace'] || 'Mercado Livre',
          descricao: row.descricao || row['Descrição'] || '',
          imagem_url: row.imagem_url || row['Imagem URL'] || '',
        });
      }
    }

    return {
      success: errors.filter(e => e.severity === 'error').length === 0,
      totalRows: data.length,
      validRows: validData.length,
      invalidRows: data.length - validData.length,
      errors,
      warnings,
      data: validData,
      summary: {} as any, // Será preenchido depois
    };
  }

  /**
   * Valida dados de pedidos
   */
  private static async validatePedidos(
    data: any[],
    options: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validData: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      let isValid = true;

      // Validar número do pedido
      if (!row.numero_pedido || row.numero_pedido.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'numero_pedido',
          value: row.numero_pedido,
          message: 'Número do pedido é obrigatório',
          severity: 'error',
        });
        isValid = false;
      } else {
        // Verificar se pedido já existe
        const existingOrder = await query(
          'SELECT id FROM pedidos WHERE numero_pedido = $1 LIMIT 1',
          [row.numero_pedido]
        );
        
        if (existingOrder.rows.length > 0) {
          warnings.push({
            row: rowNumber,
            field: 'numero_pedido',
            value: row.numero_pedido,
            message: 'Pedido já existe no sistema - será atualizado se importar',
          });
        }
      }

      // Validar cliente
      if (!row.cliente_nome || row.cliente_nome.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'cliente_nome',
          value: row.cliente_nome,
          message: 'Nome do cliente é obrigatório',
          severity: 'error',
        });
        isValid = false;
      }

      // Validar valor total
      const valorTotal = parseFloat(row.valor_total || row['Valor Total'] || 0);
      if (isNaN(valorTotal) || valorTotal <= 0) {
        errors.push({
          row: rowNumber,
          field: 'valor_total',
          value: row.valor_total,
          message: 'Valor total inválido',
          severity: 'error',
        });
        isValid = false;
      }

      // Validar marketplace
      if (!row.marketplace) {
        warnings.push({
          row: rowNumber,
          field: 'marketplace',
          value: row.marketplace,
          message: 'Marketplace não informado - será definido como "Mercado Livre"',
        });
      }

      // Validar status
      const statusValidos = ['pendente', 'conferido', 'enviado', 'entregue', 'cancelado'];
      const status = (row.status || 'pendente').toLowerCase();
      if (!statusValidos.includes(status)) {
        warnings.push({
          row: rowNumber,
          field: 'status',
          value: row.status,
          message: `Status inválido - será definido como "pendente". Valores válidos: ${statusValidos.join(', ')}`,
        });
      }

      // Normalizar dados
      if (isValid) {
        validData.push({
          numero_pedido: row.numero_pedido?.trim(),
          cliente_nome: row.cliente_nome?.trim(),
          marketplace: row.marketplace || 'Mercado Livre',
          valor_total: valorTotal,
          status: statusValidos.includes(status) ? status : 'pendente',
          data_pedido: row.data_pedido || new Date(),
          rastreio: row.rastreio || null,
          observacoes: row.observacoes || row['Observações'] || '',
        });
      }
    }

    return {
      success: errors.filter(e => e.severity === 'error').length === 0,
      totalRows: data.length,
      validRows: validData.length,
      invalidRows: data.length - validData.length,
      errors,
      warnings,
      data: validData,
      summary: {} as any,
    };
  }

  /**
   * Valida dados de clientes
   */
  private static async validateClientes(
    data: any[],
    options: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validData: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      let isValid = true;

      // Validar nome
      if (!row.nome || row.nome.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'nome',
          value: row.nome,
          message: 'Nome do cliente é obrigatório',
          severity: 'error',
        });
        isValid = false;
      }

      // Validar email (se fornecido)
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push({
          row: rowNumber,
          field: 'email',
          value: row.email,
          message: 'Email inválido',
          severity: 'error',
        });
        isValid = false;
      }

      // Validar telefone (se fornecido)
      if (row.telefone) {
        const telefone = row.telefone.replace(/\D/g, '');
        if (telefone.length < 10 || telefone.length > 11) {
          warnings.push({
            row: rowNumber,
            field: 'telefone',
            value: row.telefone,
            message: 'Telefone pode estar em formato inválido',
          });
        }
      }

      // Normalizar dados
      if (isValid) {
        validData.push({
          nome: row.nome?.trim(),
          email: row.email?.trim() || null,
          telefone: row.telefone?.trim() || null,
          cpf_cnpj: row.cpf_cnpj || row['CPF/CNPJ'] || null,
          endereco: row.endereco || row['Endereço'] || null,
          cidade: row.cidade || null,
          estado: row.estado || null,
          cep: row.cep || row['CEP'] || null,
        });
      }
    }

    return {
      success: errors.filter(e => e.severity === 'error').length === 0,
      totalRows: data.length,
      validRows: validData.length,
      invalidRows: data.length - validData.length,
      errors,
      warnings,
      data: validData,
      summary: {} as any,
    };
  }

  /**
   * Gera planilha de exemplo para download
   */
  static generateExampleSpreadsheet(entityType: 'produtos' | 'pedidos' | 'clientes'): Buffer {
    let data: any[];

    switch (entityType) {
      case 'produtos':
        data = [
          {
            nome: 'Produto Exemplo 1',
            sku: 'PROD-001',
            categoria: 'Eletrônicos',
            preco_venda: 99.90,
            preco_custo: 50.00,
            estoque_atual: 100,
            estoque_minimo: 10,
            status: 'ativo',
            marketplace: 'Mercado Livre',
            descricao: 'Descrição do produto',
            imagem_url: 'https://exemplo.com/imagem.jpg',
          },
          {
            nome: 'Produto Exemplo 2',
            sku: 'PROD-002',
            categoria: 'Acessórios',
            preco_venda: 49.90,
            preco_custo: 25.00,
            estoque_atual: 50,
            estoque_minimo: 5,
            status: 'ativo',
            marketplace: 'Mercado Livre',
            descricao: '',
            imagem_url: '',
          },
        ];
        break;

      case 'pedidos':
        data = [
          {
            numero_pedido: 'ML-2026010601',
            cliente_nome: 'João Silva',
            marketplace: 'Mercado Livre',
            valor_total: 149.90,
            status: 'pendente',
            data_pedido: '2026-01-06',
            rastreio: '',
            observacoes: '',
          },
          {
            numero_pedido: 'ML-2026010602',
            cliente_nome: 'Maria Santos',
            marketplace: 'Mercado Livre',
            valor_total: 89.90,
            status: 'conferido',
            data_pedido: '2026-01-06',
            rastreio: 'BR123456789ML',
            observacoes: 'Entrega urgente',
          },
        ];
        break;

      case 'clientes':
        data = [
          {
            nome: 'João Silva',
            email: 'joao@exemplo.com',
            telefone: '(11) 98765-4321',
            cpf_cnpj: '123.456.789-00',
            endereco: 'Rua Exemplo, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567',
          },
          {
            nome: 'Maria Santos',
            email: 'maria@exemplo.com',
            telefone: '(21) 91234-5678',
            cpf_cnpj: '987.654.321-00',
            endereco: 'Av. Teste, 456',
            cidade: 'Rio de Janeiro',
            estado: 'RJ',
            cep: '20000-000',
          },
        ];
        break;

      default:
        throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    }

    // Criar workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

    // Converter para buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
