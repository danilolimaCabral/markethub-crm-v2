/**
 * Serviço de Monitoramento de Estoque
 * Gerencia alertas automáticos e ações baseadas em níveis de estoque
 */

export interface StockAlert {
  id: string;
  produtoId: string;
  produtoNome: string;
  estoqueAtual: number;
  tipo: 'baixo' | 'zerado' | 'reposto';
  timestamp: string;
  lido: boolean;
}

export interface ProdutoGiro {
  produtoId: string;
  produtoNome: string;
  vendasUltimos30Dias: number;
  giro: 'alto' | 'medio' | 'baixo';
  prioridade: number; // 1 = alta, 2 = média, 3 = baixa
}

const ESTOQUE_BAIXO_LIMITE = 15;
const ESTOQUE_ZERADO = 0;

/**
 * Verifica estoque de todos os produtos e gera alertas
 */
export function verificarEstoque(): StockAlert[] {
  const produtosStr = localStorage.getItem('markethub_produtos');
  if (!produtosStr) return [];

  const produtos = JSON.parse(produtosStr);
  const alertas: StockAlert[] = [];
  const alertasExistentes = getAlertas();

  produtos.forEach((produto: any) => {
    // Alerta de estoque baixo (< 15 unidades)
    if (produto.estoque > 0 && produto.estoque < ESTOQUE_BAIXO_LIMITE) {
      // Verifica se já existe alerta não lido para este produto
      const alertaExistente = alertasExistentes.find(
        a => a.produtoId === produto.id && a.tipo === 'baixo' && !a.lido
      );

      if (!alertaExistente) {
        alertas.push({
          id: `alert-${Date.now()}-${produto.id}`,
          produtoId: produto.id,
          produtoNome: produto.nome,
          estoqueAtual: produto.estoque,
          tipo: 'baixo',
          timestamp: new Date().toISOString(),
          lido: false
        });
      }
    }

    // Alerta de estoque zerado
    if (produto.estoque === ESTOQUE_ZERADO) {
      const alertaExistente = alertasExistentes.find(
        a => a.produtoId === produto.id && a.tipo === 'zerado' && !a.lido
      );

      if (!alertaExistente) {
        alertas.push({
          id: `alert-${Date.now()}-${produto.id}`,
          produtoId: produto.id,
          produtoNome: produto.nome,
          estoqueAtual: 0,
          tipo: 'zerado',
          timestamp: new Date().toISOString(),
          lido: false
        });

        // Pausar anúncio automaticamente
        pausarAnuncio(produto.id);
      }
    }
  });

  // Salvar novos alertas
  if (alertas.length > 0) {
    const todosAlertas = [...alertasExistentes, ...alertas];
    localStorage.setItem('markethub_stock_alerts', JSON.stringify(todosAlertas));
  }

  return alertas;
}

/**
 * Pausa anúncio quando estoque zera
 */
function pausarAnuncio(produtoId: string) {
  const anunciosStr = localStorage.getItem('markethub_anuncios');
  if (!anunciosStr) return;

  const anuncios = JSON.parse(anunciosStr);
  const anuncio = anuncios.find((a: any) => a.produtoId === produtoId);

  if (anuncio && anuncio.status === 'ativo') {
    anuncio.status = 'pausado';
    anuncio.motivoPausa = 'Estoque zerado automaticamente';
    anuncio.pausadoEm = new Date().toISOString();

    localStorage.setItem('markethub_anuncios', JSON.stringify(anuncios));

    // Registrar log
    registrarLog({
      tipo: 'pausa_automatica',
      produtoId,
      anuncioId: anuncio.id,
      motivo: 'Estoque zerado',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Reativa anúncio quando estoque é reposto
 */
export function verificarReativacao(produtoId: string, novoEstoque: number) {
  if (novoEstoque <= 0) return;

  const anunciosStr = localStorage.getItem('markethub_anuncios');
  if (!anunciosStr) return;

  const anuncios = JSON.parse(anunciosStr);
  const anuncio = anuncios.find((a: any) => a.produtoId === produtoId);

  if (anuncio && anuncio.status === 'pausado' && anuncio.motivoPausa?.includes('Estoque zerado')) {
    // Verificar prioridade de reativação
    const giro = calcularGiroProduto(produtoId);
    
    anuncio.status = 'ativo';
    anuncio.motivoPausa = null;
    anuncio.reativadoEm = new Date().toISOString();
    anuncio.prioridade = giro.prioridade;

    localStorage.setItem('markethub_anuncios', JSON.stringify(anuncios));

    // Criar alerta de reativação
    const alertas = getAlertas();
    alertas.push({
      id: `alert-${Date.now()}-${produtoId}`,
      produtoId,
      produtoNome: anuncio.titulo,
      estoqueAtual: novoEstoque,
      tipo: 'reposto',
      timestamp: new Date().toISOString(),
      lido: false
    });
    localStorage.setItem('markethub_stock_alerts', JSON.stringify(alertas));

    // Registrar log
    registrarLog({
      tipo: 'reativacao_automatica',
      produtoId,
      anuncioId: anuncio.id,
      novoEstoque,
      prioridade: giro.giro,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Calcula giro do produto (vendas últimos 30 dias)
 */
export function calcularGiroProduto(produtoId: string): ProdutoGiro {
  const pedidosStr = localStorage.getItem('markethub_pedidos');
  const produtosStr = localStorage.getItem('markethub_produtos');

  if (!pedidosStr || !produtosStr) {
    return {
      produtoId,
      produtoNome: '',
      vendasUltimos30Dias: 0,
      giro: 'baixo',
      prioridade: 3
    };
  }

  const pedidos = JSON.parse(pedidosStr);
  const produtos = JSON.parse(produtosStr);
  const produto = produtos.find((p: any) => p.id === produtoId);

  // Contar vendas dos últimos 30 dias
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 30);

  const vendas = pedidos.filter((pedido: any) => {
    const dataPedido = new Date(pedido.data);
    return dataPedido >= dataLimite && 
           pedido.items?.some((item: any) => item.produtoId === produtoId);
  }).length;

  // Classificar giro
  let giro: 'alto' | 'medio' | 'baixo';
  let prioridade: number;

  if (vendas >= 20) {
    giro = 'alto';
    prioridade = 1;
  } else if (vendas >= 10) {
    giro = 'medio';
    prioridade = 2;
  } else {
    giro = 'baixo';
    prioridade = 3;
  }

  return {
    produtoId,
    produtoNome: produto?.nome || '',
    vendasUltimos30Dias: vendas,
    giro,
    prioridade
  };
}

/**
 * Obtém todos os alertas
 */
export function getAlertas(): StockAlert[] {
  const alertasStr = localStorage.getItem('markethub_stock_alerts');
  return alertasStr ? JSON.parse(alertasStr) : [];
}

/**
 * Marca alerta como lido
 */
export function marcarAlertaLido(alertaId: string) {
  const alertas = getAlertas();
  const alerta = alertas.find(a => a.id === alertaId);
  if (alerta) {
    alerta.lido = true;
    localStorage.setItem('markethub_stock_alerts', JSON.stringify(alertas));
  }
}

/**
 * Registra log de ações automáticas
 */
function registrarLog(log: any) {
  const logsStr = localStorage.getItem('markethub_stock_logs');
  const logs = logsStr ? JSON.parse(logsStr) : [];
  logs.push(log);
  
  // Manter apenas últimos 1000 logs
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
  
  localStorage.setItem('markethub_stock_logs', JSON.stringify(logs));
}

/**
 * Obtém produtos ordenados por prioridade de reativação
 */
export function getProdutosPorPrioridade(): ProdutoGiro[] {
  const produtosStr = localStorage.getItem('markethub_produtos');
  if (!produtosStr) return [];

  const produtos = JSON.parse(produtosStr);
  const produtosComGiro = produtos.map((p: any) => calcularGiroProduto(p.id));

  // Ordenar por prioridade (1 = alta, 3 = baixa)
  return produtosComGiro.sort((a: ProdutoGiro, b: ProdutoGiro) => a.prioridade - b.prioridade);
}
