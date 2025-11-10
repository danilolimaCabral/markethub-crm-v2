// Gerador de Proposta Comercial em PDF
// Usa jsPDF para gerar o documento

interface DadosProposta {
  // Dados básicos
  valorMercadoria: number;
  taxaDolar: number;
  valorCIF: number;
  
  // Tributos
  impostoImportacao: number;
  ipi: number;
  pis: number;
  cofins: number;
  taxaSiscomex: number;
  
  // Despesas
  icms: number;
  marinhaMercante: number;
  honorariosComissaria: number;
  sdaDespachante: number;
  armazenagemItajai: number;
  freteRodoviario: number;
  expedienteItajai: number;
  
  // Precificação
  margemLucro: number;
  comissaoBusca: number;
  
  // Calculados
  cifReais: number;
  totalTributos: number;
  totalDespesas: number;
  custoTotal: number;
  valorComMargem: number;
  valorFinalCliente: number;
}

export function gerarPropostaHTML(dados: DadosProposta): string {
  const hoje = new Date().toLocaleDateString('pt-BR');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Proposta Comercial - Importação</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #6366f1;
      margin: 0;
    }
    .header p {
      color: #666;
      margin: 5px 0;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      background: #6366f1;
      color: white;
      padding: 10px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f3f4f6;
      font-weight: bold;
    }
    .valor {
      text-align: right;
      font-weight: bold;
    }
    .total-row {
      background: #f9fafb;
      font-weight: bold;
      font-size: 1.1em;
    }
    .valor-final {
      background: #6366f1;
      color: white;
      font-size: 1.3em;
      padding: 15px;
      text-align: center;
      margin: 20px 0;
    }
    .observacoes {
      background: #fef3c7;
      padding: 15px;
      border-left: 4px solid #f59e0b;
      margin: 20px 0;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PROPOSTA COMERCIAL</h1>
    <p>Importação e Comércio Exterior</p>
    <p>Data: ${hoje}</p>
  </div>

  <div class="section">
    <div class="section-title">1. DADOS DA OPERAÇÃO</div>
    <table>
      <tr>
        <th>Descrição</th>
        <th class="valor">Valor</th>
      </tr>
      <tr>
        <td>Valor da Mercadoria (MLE)</td>
        <td class="valor">US$ ${dados.valorMercadoria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Taxa do Dólar</td>
        <td class="valor">R$ ${dados.taxaDolar.toLocaleString('pt-BR', { minimumFractionDigits: 5 })}</td>
      </tr>
      <tr>
        <td>CIF (Custo + Seguro + Frete)</td>
        <td class="valor">US$ ${dados.valorCIF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="total-row">
        <td>CIF em Reais</td>
        <td class="valor">R$ ${dados.cifReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">2. TRIBUTOS</div>
    <table>
      <tr>
        <th>Tributo</th>
        <th class="valor">Valor (R$)</th>
      </tr>
      <tr>
        <td>Imposto de Importação</td>
        <td class="valor">R$ ${dados.impostoImportacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>IPI</td>
        <td class="valor">R$ ${dados.ipi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>PIS</td>
        <td class="valor">R$ ${dados.pis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>COFINS</td>
        <td class="valor">R$ ${dados.cofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Taxa SISCOMEX</td>
        <td class="valor">R$ ${dados.taxaSiscomex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL DOS TRIBUTOS</td>
        <td class="valor">R$ ${dados.totalTributos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">3. DESPESAS OPERACIONAIS</div>
    <table>
      <tr>
        <th>Despesa</th>
        <th class="valor">Valor (R$)</th>
      </tr>
      <tr>
        <td>ICMS</td>
        <td class="valor">R$ ${dados.icms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Marinha Mercante</td>
        <td class="valor">R$ ${dados.marinhaMercante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Honorários Comissária</td>
        <td class="valor">R$ ${dados.honorariosComissaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>SDA Despachante Aduaneiro</td>
        <td class="valor">R$ ${dados.sdaDespachante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Armazenagem Itajaí</td>
        <td class="valor">R$ ${dados.armazenagemItajai.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Frete Rodoviário / Entrega Final</td>
        <td class="valor">R$ ${dados.freteRodoviario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Expediente Itajaí</td>
        <td class="valor">R$ ${dados.expedienteItajai.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL DAS DESPESAS</td>
        <td class="valor">R$ ${dados.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">4. COMPOSIÇÃO DO PREÇO FINAL</div>
    <table>
      <tr>
        <th>Item</th>
        <th class="valor">Valor (R$)</th>
      </tr>
      <tr>
        <td>Custo Total (CIF + Tributos + Despesas)</td>
        <td class="valor">R$ ${dados.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Margem de Lucro (${dados.margemLucro}%)</td>
        <td class="valor">R$ ${(dados.valorComMargem - dados.custoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>Comissão por Buscar Produto</td>
        <td class="valor">R$ ${dados.comissaoBusca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
    </table>
  </div>

  <div class="valor-final">
    VALOR TOTAL DA PROPOSTA: R$ ${dados.valorFinalCliente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
  </div>

  <div class="observacoes">
    <strong>Observações Importantes:</strong>
    <ul>
      <li>Valores sujeitos a alteração conforme variação cambial</li>
      <li>Prazo de entrega: a definir após confirmação do pedido</li>
      <li>Validade da proposta: 7 dias</li>
      <li>Forma de pagamento: a combinar</li>
    </ul>
  </div>

  <div class="footer">
    <p><strong>MarketHub CRM</strong></p>
    <p>Sistema Inteligente de Gestão</p>
    <p>Proposta gerada automaticamente em ${hoje}</p>
  </div>
</body>
</html>
  `;
}

export function baixarPropostaHTML(dados: DadosProposta) {
  const html = gerarPropostaHTML(dados);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `proposta-comercial-${new Date().getTime()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function imprimirProposta(dados: DadosProposta) {
  const html = gerarPropostaHTML(dados);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
