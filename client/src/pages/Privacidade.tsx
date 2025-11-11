import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft, Shield, TrendingUp } from 'lucide-react';

export default function Privacidade() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-lg">Markthub CRM</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Política de Privacidade</h1>
          <p className="text-muted-foreground">
            Última atualização: 11 de novembro de 2025
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20 max-w-4xl">
        <Card>
          <CardContent className="p-8 prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Introdução</h2>
            <p>
              No Markthub CRM, levamos sua privacidade a sério. Esta política explica como coletamos, 
              usamos, armazenamos e protegemos seus dados pessoais.
            </p>

            <h2>2. Dados que Coletamos</h2>
            
            <h3>2.1. Dados de Cadastro</h3>
            <ul>
              <li>Nome completo</li>
              <li>Email</li>
              <li>Telefone (opcional)</li>
              <li>Nome da empresa</li>
              <li>CNPJ (para emissão de nota fiscal)</li>
            </ul>

            <h3>2.2. Dados de Uso</h3>
            <ul>
              <li>Pedidos, produtos e clientes cadastrados</li>
              <li>Dados financeiros (contas a pagar/receber)</li>
              <li>Integrações com marketplaces (tokens de API)</li>
              <li>Logs de acesso e uso da plataforma</li>
            </ul>

            <h3>2.3. Dados Técnicos</h3>
            <ul>
              <li>Endereço IP</li>
              <li>Navegador e dispositivo</li>
              <li>Cookies e tecnologias similares</li>
            </ul>

            <h2>3. Como Usamos Seus Dados</h2>
            <p>
              Usamos seus dados para:
            </p>
            <ul>
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Processar pagamentos e emitir notas fiscais</li>
              <li>Enviar notificações importantes (contas vencidas, estoque baixo)</li>
              <li>Personalizar sua experiência (Mia aprende com seus dados)</li>
              <li>Suporte técnico e atendimento</li>
              <li>Análises internas para melhorar a plataforma</li>
            </ul>

            <h2>4. Compartilhamento de Dados</h2>
            <p>
              <strong>NÃO vendemos seus dados.</strong> Compartilhamos apenas quando necessário:
            </p>
            <ul>
              <li><strong>Marketplaces:</strong> Apenas dados necessários para integrações (ex: Mercado Livre API)</li>
              <li><strong>Processadores de Pagamento:</strong> Para processar assinaturas</li>
              <li><strong>Serviços de Infraestrutura:</strong> Railway (hospedagem), AWS (backups)</li>
              <li><strong>Obrigações Legais:</strong> Se exigido por lei ou ordem judicial</li>
            </ul>

            <h2>5. Segurança</h2>
            <p>
              Protegemos seus dados com:
            </p>
            <ul>
              <li><strong>Criptografia:</strong> HTTPS/TLS para transmissão, AES-256 para armazenamento</li>
              <li><strong>Autenticação:</strong> Senhas com hash bcrypt, 2FA opcional</li>
              <li><strong>Backups:</strong> Diários, criptografados</li>
              <li><strong>Acesso Restrito:</strong> Apenas equipe autorizada</li>
              <li><strong>Monitoramento:</strong> Logs de segurança 24/7</li>
            </ul>

            <h2>6. Seus Direitos (LGPD)</h2>
            <p>
              Você tem direito a:
            </p>
            <ul>
              <li><strong>Acesso:</strong> Ver quais dados temos sobre você</li>
              <li><strong>Correção:</strong> Atualizar dados incorretos</li>
              <li><strong>Exclusão:</strong> Deletar sua conta e dados (exceto obrigações legais)</li>
              <li><strong>Portabilidade:</strong> Exportar seus dados em formato legível</li>
              <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
            </ul>
            <p>
              Para exercer seus direitos, acesse <strong>Configurações → Privacidade</strong> ou entre em contato: 
              <a href="mailto:contato@markthubcrm.com.br" className="text-purple-600 hover:underline">contato@markthubcrm.com.br</a>
            </p>

            <h2>7. Cookies</h2>
            <p>
              Usamos cookies para:
            </p>
            <ul>
              <li><strong>Essenciais:</strong> Login, sessão, preferências (obrigatórios)</li>
              <li><strong>Analíticos:</strong> Entender como você usa a plataforma (opcional)</li>
              <li><strong>Marketing:</strong> Não usamos cookies de marketing</li>
            </ul>
            <p>
              Você pode gerenciar cookies nas configurações do navegador.
            </p>

            <h2>8. Retenção de Dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após cancelamento:
            </p>
            <ul>
              <li><strong>30 dias:</strong> Período de recuperação (você pode reativar)</li>
              <li><strong>Após 30 dias:</strong> Dados são anonimizados ou deletados</li>
              <li><strong>Exceções:</strong> Dados fiscais (5 anos por lei) e logs de segurança (1 ano)</li>
            </ul>

            <h2>9. Transferência Internacional</h2>
            <p>
              Seus dados são armazenados em servidores nos EUA (Railway, AWS). 
              Garantimos proteção adequada através de:
            </p>
            <ul>
              <li>Cláusulas contratuais padrão</li>
              <li>Certificações de segurança (SOC 2, ISO 27001)</li>
              <li>Criptografia em trânsito e repouso</li>
            </ul>

            <h2>10. Menores de Idade</h2>
            <p>
              O Markthub CRM não é destinado a menores de 18 anos. 
              Não coletamos intencionalmente dados de menores.
            </p>

            <h2>11. Mudanças nesta Política</h2>
            <p>
              Podemos atualizar esta política ocasionalmente. Notificaremos você por email 
              sobre mudanças significativas. A data de "Última atualização" será sempre atualizada.
            </p>

            <h2>12. Contato - DPO</h2>
            <p>
              Para questões sobre privacidade, entre em contato com nosso Encarregado de Proteção de Dados (DPO):
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:contato@markthubcrm.com.br" className="text-purple-600 hover:underline">contato@markthubcrm.com.br</a></li>
              <li><strong>Assunto:</strong> "LGPD - Privacidade"</li>
            </ul>

            <div className="mt-12 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-0">
                <strong>Última atualização:</strong> 11 de novembro de 2025<br />
                <strong>Versão:</strong> 1.0<br />
                <strong>Conformidade:</strong> LGPD (Lei 13.709/2018)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Markthub CRM. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
