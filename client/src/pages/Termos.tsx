import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft, FileText, TrendingUp } from 'lucide-react';

export default function Termos() {
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
          <FileText className="w-16 h-16 text-purple-600 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Termos de Uso</h1>
          <p className="text-muted-foreground">
            Última atualização: 11 de novembro de 2025
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20 max-w-4xl">
        <Card>
          <CardContent className="p-8 prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o Markthub CRM, você concorda com estes Termos de Uso. 
              Se você não concordar com algum termo, não use nossa plataforma.
            </p>

            <h2>2. Descrição do Serviço</h2>
            <p>
              O Markthub CRM é uma plataforma de gestão para vendedores de marketplace que oferece:
            </p>
            <ul>
              <li>Calculadora automática de taxas do Mercado Livre</li>
              <li>Gestão de pedidos, produtos e estoque</li>
              <li>Análise financeira e relatórios</li>
              <li>Assistente IA (Mia) para insights</li>
              <li>Integrações com marketplaces</li>
            </ul>

            <h2>3. Cadastro e Conta</h2>
            <p>
              Para usar o Markthub CRM, você deve:
            </p>
            <ul>
              <li>Fornecer informações verdadeiras e completas</li>
              <li>Manter suas credenciais seguras</li>
              <li>Ser responsável por todas as atividades em sua conta</li>
              <li>Notificar-nos imediatamente sobre uso não autorizado</li>
            </ul>

            <h2>4. Trial Gratuito</h2>
            <p>
              Oferecemos um período de trial gratuito de 14 dias:
            </p>
            <ul>
              <li>Sem necessidade de cartão de crédito</li>
              <li>Acesso completo a todas as funcionalidades</li>
              <li>Pode ser cancelado a qualquer momento</li>
              <li>Após o trial, você pode assinar um plano pago ou continuar com recursos limitados</li>
            </ul>

            <h2>5. Planos e Pagamentos</h2>
            <p>
              Nossos planos pagos são cobrados mensalmente:
            </p>
            <ul>
              <li>Starter: R$ 97/mês</li>
              <li>Professional: R$ 197/mês</li>
              <li>Business: R$ 397/mês</li>
              <li>Enterprise: R$ 797/mês</li>
            </ul>
            <p>
              Você pode cancelar sua assinatura a qualquer momento. 
              Não há reembolso proporcional para cancelamentos no meio do ciclo.
            </p>

            <h2>6. Uso Aceitável</h2>
            <p>
              Você concorda em NÃO:
            </p>
            <ul>
              <li>Usar a plataforma para atividades ilegais</li>
              <li>Tentar acessar áreas restritas do sistema</li>
              <li>Fazer engenharia reversa do software</li>
              <li>Sobrecarregar nossos servidores</li>
              <li>Revender ou redistribuir nossos serviços</li>
            </ul>

            <h2>7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, código, design e marca do Markthub CRM são de nossa propriedade 
              e protegidos por leis de direitos autorais e marcas registradas.
            </p>

            <h2>8. Privacidade de Dados</h2>
            <p>
              Seus dados são tratados conforme nossa <a href="/privacidade" className="text-purple-600 hover:underline">Política de Privacidade</a>. 
              Resumidamente:
            </p>
            <ul>
              <li>Não vendemos seus dados</li>
              <li>Usamos criptografia para proteger informações sensíveis</li>
              <li>Você pode exportar ou deletar seus dados a qualquer momento</li>
            </ul>

            <h2>9. Limitação de Responsabilidade</h2>
            <p>
              O Markthub CRM é fornecido "como está". Não garantimos:
            </p>
            <ul>
              <li>Disponibilidade 100% do tempo (embora nos esforcemos para isso)</li>
              <li>Precisão absoluta dos cálculos (sempre revise valores importantes)</li>
              <li>Compatibilidade com todas as integrações de terceiros</li>
            </ul>
            <p>
              Não somos responsáveis por perdas financeiras decorrentes do uso da plataforma.
            </p>

            <h2>10. Modificações</h2>
            <p>
              Podemos modificar estes Termos a qualquer momento. Notificaremos você por email 
              sobre mudanças significativas. O uso contínuo após mudanças constitui aceitação.
            </p>

            <h2>11. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar sua conta se você violar estes Termos. 
              Você pode cancelar sua conta a qualquer momento nas configurações.
            </p>

            <h2>12. Lei Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis brasileiras. 
              Foro: Comarca de Goiânia, GO.
            </p>

            <h2>13. Contato</h2>
            <p>
              Dúvidas sobre estes Termos? Entre em contato:
            </p>
            <ul>
              <li>Email: <a href="mailto:contato@markthubcrm.com.br" className="text-purple-600 hover:underline">contato@markthubcrm.com.br</a></li>
              <li>Chat Mia: Disponível 24/7 no site</li>
            </ul>

            <div className="mt-12 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-0">
                <strong>Última atualização:</strong> 11 de novembro de 2025<br />
                <strong>Versão:</strong> 1.0
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
