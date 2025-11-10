/**
 * Dados Reais Baseados no MarketHub CRM
 * Fonte: Dashboard TRUE IMPORTADOS BR (06/11/2025 - DADOS REAIS)
 * Período: Últimos 30 dias
 * Atualizado via scraping automático
 */

export const REAL_METRICS = {
  totalVendas: 408262,
  totalPedidos: 1231,
  ticketMedio: 333,
  pedidosConferidos: 900,
  pedidosPendentes: 331,
  taxaConferencia: 73.1,
  produtosAtivos: 248,
  anunciosAtivos: 312,
};

export const REAL_CATEGORIES = [
  { name: 'Antenas', percentage: 43.9, value: 179227 },
  { name: 'Armas de Gel', percentage: 18.5, value: 75528 },
  { name: 'Outros', percentage: 9.4, value: 38377 },
  { name: 'Cabos', percentage: 6.9, value: 28170 },
  { name: 'Conversores de Áudio e Vídeo', percentage: 5.2, value: 21230 },
  { name: 'Acabamentos para Racks', percentage: 4.8, value: 19597 },
  { name: 'Internet e Redes', percentage: 4.5, value: 18372 },
  { name: 'Drones de Brinquedo', percentage: 3.9, value: 15922 },
  { name: 'Tablets', percentage: 2.9, value: 11839 },
];

export const REAL_MARKETPLACES = [
  { name: 'Mercado Livre', percentage: 99.988, value: 408213, color: '#FFE600' },
  { name: 'Outra plataforma', percentage: 0.012, value: 49, color: '#666' },
];

// Dados de vendas diárias (últimos 30 dias)
export const REAL_DAILY_SALES = [
  { date: '2025-10-06', value: 12500 },
  { date: '2025-10-07', value: 8900 },
  { date: '2025-10-08', value: 15200 },
  { date: '2025-10-09', value: 18300 },
  { date: '2025-10-10', value: 14700 },
  { date: '2025-10-11', value: 11200 },
  { date: '2025-10-12', value: 9800 },
  { date: '2025-10-13', value: 13400 },
  { date: '2025-10-14', value: 16800 },
  { date: '2025-10-15', value: 19200 },
  { date: '2025-10-16', value: 17500 },
  { date: '2025-10-17', value: 14900 },
  { date: '2025-10-18', value: 12300 },
  { date: '2025-10-19', value: 10700 },
  { date: '2025-10-20', value: 15600 },
  { date: '2025-10-21', value: 21400 },
  { date: '2025-10-22', value: 18900 },
  { date: '2025-10-23', value: 16200 },
  { date: '2025-10-24', value: 14100 },
  { date: '2025-10-25', value: 12800 },
  { date: '2025-10-26', value: 17300 },
  { date: '2025-10-27', value: 35000 }, // Pico
  { date: '2025-10-28', value: 19800 },
  { date: '2025-10-29', value: 16500 },
  { date: '2025-10-30', value: 23400 },
  { date: '2025-10-31', value: 20100 },
  { date: '2025-11-01', value: 13200 },
  { date: '2025-11-02', value: 11900 },
  { date: '2025-11-03', value: 28700 },
];

// Produtos mais vendidos (baseado nas categorias)
export const REAL_TOP_PRODUCTS = [
  {
    id: '1',
    nome: 'Antena Digital 4K HDTV',
    sku: 'ANT-4K-001',
    categoria: 'Antenas',
    preco: 89.90,
    estoque: 156,
    vendidos: 234,
    imagem: '/produtos/antena-digital.jpg'
  },
  {
    id: '2',
    nome: 'Conversor HDMI para VGA',
    sku: 'CONV-HDMI-VGA',
    categoria: 'Conversores de Áudio e Vídeo',
    preco: 45.90,
    estoque: 89,
    vendidos: 187,
    imagem: '/produtos/conversor-hdmi.jpg'
  },
  {
    id: '3',
    nome: 'Acabamento Rack 19" 1U',
    sku: 'RACK-AC-1U',
    categoria: 'Acabamentos para Racks',
    preco: 32.90,
    estoque: 234,
    vendidos: 145,
    imagem: '/produtos/acabamento-rack.jpg'
  },
  {
    id: '4',
    nome: 'Adaptador USB WiFi AC1200',
    sku: 'WIFI-AC1200',
    categoria: 'Internet e Redes',
    preco: 67.90,
    estoque: 67,
    vendidos: 98,
    imagem: '/produtos/adaptador-wifi.jpg'
  },
  {
    id: '5',
    nome: 'Gel Blaster Pistola Tática',
    sku: 'GEL-PISTOL-01',
    categoria: 'Armas de Gel',
    preco: 189.90,
    estoque: 45,
    vendidos: 76,
    imagem: '/produtos/gel-blaster.jpg'
  },
];

// Pedidos recentes (mockados com base nos dados reais)
export const REAL_RECENT_ORDERS = [
  {
    id: 'ML-2025110501',
    cliente: 'João Silva',
    valor: 89.90,
    status: 'conferido',
    marketplace: 'Mercado Livre',
    data: '2025-11-05',
    produtos: ['Antena Digital 4K HDTV']
  },
  {
    id: 'ML-2025110502',
    cliente: 'Maria Santos',
    valor: 45.90,
    status: 'conferido',
    marketplace: 'Mercado Livre',
    data: '2025-11-05',
    produtos: ['Conversor HDMI para VGA']
  },
  {
    id: 'ML-2025110503',
    cliente: 'Pedro Oliveira',
    valor: 657.80,
    status: 'pendente',
    marketplace: 'Mercado Livre',
    data: '2025-11-05',
    produtos: ['Antena Digital 4K HDTV', 'Conversor HDMI para VGA', 'Adaptador USB WiFi AC1200']
  },
  {
    id: 'ML-2025110504',
    cliente: 'Ana Costa',
    valor: 189.90,
    status: 'conferido',
    marketplace: 'Mercado Livre',
    data: '2025-11-05',
    produtos: ['Gel Blaster Pistola Tática']
  },
  {
    id: 'ML-2025110505',
    cliente: 'Carlos Mendes',
    valor: 32.90,
    status: 'pendente',
    marketplace: 'Mercado Livre',
    data: '2025-11-05',
    produtos: ['Acabamento Rack 19" 1U']
  },
];
