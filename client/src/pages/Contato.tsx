import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';
import { ArrowLeft, Mail, MessageSquare, Phone, MapPin, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Contato() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simular envio
    toast.success('Mensagem enviada com sucesso! Responderemos em até 24h.');
    
    // Limpar formulário
    setFormData({ nome: '', email: '', assunto: '', mensagem: '' });
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

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Entre em Contato
          </h1>
          <p className="text-xl text-muted-foreground">
            Estamos aqui para ajudar! Envie sua mensagem e responderemos em até 24 horas.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Informações de Contato */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <Mail className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-bold mb-2">Email</h3>
                <a 
                  href="mailto:contato@markthubcrm.com.br"
                  className="text-muted-foreground hover:text-purple-600 transition"
                >
                  contato@markthubcrm.com.br
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <MessageSquare className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-bold mb-2">Chat Mia</h3>
                <p className="text-muted-foreground text-sm">
                  Disponível 24/7 no site
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Clock className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-bold mb-2">Horário</h3>
                <p className="text-muted-foreground text-sm">
                  Segunda a Sexta<br />
                  9h às 18h (Brasília)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <MapPin className="w-8 h-8 text-red-600 mb-4" />
                <h3 className="font-bold mb-2">Localização</h3>
                <p className="text-muted-foreground text-sm">
                  Goiânia, GO<br />
                  Brasil
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Formulário */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Envie sua mensagem</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        placeholder="Seu nome completo"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assunto">Assunto *</Label>
                    <Input
                      id="assunto"
                      placeholder="Sobre o que você quer falar?"
                      value={formData.assunto}
                      onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensagem">Mensagem *</Label>
                    <Textarea
                      id="mensagem"
                      placeholder="Descreva sua dúvida, sugestão ou problema..."
                      rows={6}
                      value={formData.mensagem}
                      onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Mensagem
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    Responderemos em até 24 horas úteis
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
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
