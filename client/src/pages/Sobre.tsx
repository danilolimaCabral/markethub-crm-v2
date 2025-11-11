import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { ArrowLeft, Target, Users, Zap, Award, TrendingUp, Heart } from 'lucide-react';

export default function Sobre() {
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
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Sobre o Markthub CRM
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            A única ferramenta autônoma do mercado para vendedores de marketplace
          </p>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Heart className="w-8 h-8 text-purple-600" />
                Nossa História
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  O Markthub CRM nasceu da frustração de vendedores de marketplace que perdiam dinheiro sem saber. 
                  A maioria dos vendedores não calcula corretamente as taxas do Mercado Livre, ICMS por estado, 
                  e outros custos ocultos que comem a margem de lucro.
                </p>
                <p>
                  Criamos a primeira calculadora automática de taxas do Mercado Livre do Brasil, que considera 
                  TODOS os custos: comissão ML, taxa Pix, ICMS por estado, Simples Nacional, e muito mais.
                </p>
                <p>
                  Hoje, mais de 500 vendedores economizam milhares de reais por mês usando o Markthub CRM 
                  para tomar decisões baseadas em dados reais, não em achismos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Missão, Visão, Valores */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8">
                <Target className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Missão</h3>
                <p className="text-muted-foreground">
                  Empoderar vendedores de marketplace com ferramentas autônomas e inteligentes 
                  que mostram o lucro real após todas as taxas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <Zap className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Visão</h3>
                <p className="text-muted-foreground">
                  Ser a ferramenta #1 de gestão para vendedores de marketplace no Brasil, 
                  reconhecida pela precisão e autonomia.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <Award className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Valores</h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>✅ Transparência total</li>
                  <li>✅ Dados reais, não estimativas</li>
                  <li>✅ Autonomia do vendedor</li>
                  <li>✅ Inovação constante</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Por que somos únicos?</h2>
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Calculadora Automática de Taxas ML</h3>
                    <p className="text-muted-foreground">
                      A ÚNICA ferramenta que calcula automaticamente TODAS as taxas do Mercado Livre, 
                      incluindo ICMS por estado (Goiás 19%, SP 18%, etc).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Assistente IA (Mia)</h3>
                    <p className="text-muted-foreground">
                      Mia analisa seus dados e sugere ações: quando pausar anúncios, 
                      quais produtos têm melhor margem, e muito mais.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Lucro Líquido Real</h3>
                    <p className="text-muted-foreground">
                      Mostra o lucro REAL após TODAS as taxas: ML, Pix, ICMS, Simples Nacional, 
                      frete, embalagem, e custos operacionais.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para vender com inteligência?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a mais de 500 vendedores que já economizam milhares por mês
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8"
            onClick={() => setLocation('/cadastro')}
          >
            Começar Trial Gratuito de 14 Dias
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Markthub CRM. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
