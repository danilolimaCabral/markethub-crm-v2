import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { ArrowLeft, Rocket, Bell, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface EmBreveProps {
  titulo: string;
  descricao: string;
  icone?: React.ReactNode;
}

export default function EmBreve({ 
  titulo = "Em Breve", 
  descricao = "Estamos trabalhando nesta funcionalidade",
  icone
}: EmBreveProps) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');

  const handleNotificar = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Você será notificado quando esta funcionalidade estiver disponível!');
    setEmail('');
  };

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

      {/* Content */}
      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            {icone || <Rocket className="w-12 h-12 text-purple-600" />}
          </div>
          <h1 className="text-4xl font-bold mb-4">{titulo}</h1>
          <p className="text-xl text-muted-foreground">{descricao}</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <Bell className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Seja Notificado</h2>
              <p className="text-muted-foreground">
                Deixe seu email e te avisaremos quando esta funcionalidade estiver pronta!
              </p>
            </div>

            <form onSubmit={handleNotificar} className="space-y-4">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-center"
              />
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notificar-me
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t">
              <h3 className="font-bold mb-4 text-center">Enquanto isso...</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation('/cadastro')}
                >
                  ✨ Experimente o Trial Gratuito de 14 Dias
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation('/contato')}
                >
                  💬 Fale com Nossa Equipe
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation('/')}
                >
                  🏠 Voltar para Home
                </Button>
              </div>
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

// Páginas específicas usando o componente EmBreve
export function Blog() {
  return (
    <EmBreve
      titulo="Blog em Breve"
      descricao="Estamos preparando conteúdos incríveis sobre vendas em marketplace, dicas de gestão e novidades do Markthub CRM"
    />
  );
}

export function Tutoriais() {
  return (
    <EmBreve
      titulo="Tutoriais em Breve"
      descricao="Tutoriais em vídeo e passo a passo para você dominar todas as funcionalidades do Markthub CRM"
    />
  );
}

export function BaseConhecimento() {
  return (
    <EmBreve
      titulo="Base de Conhecimento em Breve"
      descricao="Central de ajuda completa com FAQs, guias e respostas para todas as suas dúvidas"
    />
  );
}

export function APIDocs() {
  return (
    <EmBreve
      titulo="API Docs em Breve"
      descricao="Documentação completa da API do Markthub CRM para integrações personalizadas"
    />
  );
}

export function Integracoes() {
  return (
    <EmBreve
      titulo="Integrações em Breve"
      descricao="Novas integrações com Shopee, Amazon, Magalu e muito mais estão chegando!"
    />
  );
}

export function Roadmap() {
  return (
    <EmBreve
      titulo="Roadmap em Breve"
      descricao="Veja o que estamos desenvolvendo e vote nas próximas funcionalidades"
    />
  );
}
