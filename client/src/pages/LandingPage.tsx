import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowRight, CheckCircle2, Zap, Shield, Gauge, Settings, Play, ChevronRight, TrendingUp, Instagram, Facebook, Linkedin, Youtube, Twitter } from "lucide-react";
import { useLocation } from "wouter";
import HeroCalculator from "@/components/HeroCalculator";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useRef } from "react";
import ChatGemini from '@/components/ChatGemini';
import { MegaMenu } from "@/components/layout/MegaMenu";

const MagneticButton = ({ children, className, onClick, variant = "primary" }: any) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseLine = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.2);
    y.set((clientY - centerY) * 0.2);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseLine}
      onMouseLeave={reset}
      onClick={onClick}
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
};

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { scrollY } = useScroll();

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 font-sans selection:bg-purple-100 selection:text-purple-900">
      <ChatGemini autoOpen={true} />

      {/* --- Header --- */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <span className="text-white font-bold text-xl tracking-tighter">M</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-zinc-900">Markthub</span>
          </div>

          <div className="hidden md:block">
            <MegaMenu />
          </div>

          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setLocation("/login")} className="hover:bg-zinc-50 font-medium">Entrar</Button>
            <Button onClick={() => setLocation("/cadastro")} className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 shadow-xl shadow-zinc-200">
              Criar Conta
            </Button>
          </div>
        </div>
      </motion.header>

      {/* --- Hero Section --- */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-50 via-white to-white" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-100/50 rounded-full blur-[80px]" />

        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-12">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-purple-100 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-purple-900">Nova Versão 2.1 Disponível</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-zinc-900 leading-[0.95]">
              Domine o <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Mercado Livre
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-500 max-w-2xl leading-relaxed">
              A única plataforma que mostra seu <span className="text-zinc-900 font-semibold">lucro real</span>.
              Sincronize estoque, calcule impostos e automatize sua operação em segundos.
            </p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 items-center"
            >
              <MagneticButton
                onClick={() => setLocation("/cadastro")}
                className="h-16 px-10 rounded-2xl bg-zinc-900 text-white font-bold text-lg shadow-2xl shadow-zinc-300 hover:shadow-zinc-400 transition-all flex items-center gap-3"
              >
                Começar Grátis <ArrowRight className="w-5 h-5" />
              </MagneticButton>

              <Button
                variant="outline"
                onClick={() => setLocation("/demo")}
                className="h-16 px-10 rounded-2xl border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50 text-lg flex items-center gap-3"
              >
                <Play className="w-4 h-4 fill-current" /> Ver Demo
              </Button>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="w-full max-w-5xl mt-20 relative z-10"
            >
              {/* Clean container for calculator */}
              <div className="relative z-0 p-1 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-200">
                <HeroCalculator />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Diagnosis Section --- */}
      <section className="py-32 bg-zinc-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Sua Realidade vs. <span className="text-purple-600">Markthub</span></h2>
            <p className="text-zinc-500 text-lg">Por que 2.000+ vendedores migraram este mês.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Chaos Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-12 rounded-3xl bg-white border border-red-100/50 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-20 bg-red-50 rounded-bl-[100px]" />
              <h3 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><Zap className="w-4 h-4" /></span>
                Hoje
              </h3>
              <ul className="space-y-4">
                {[
                  "Planilhas que travam e desatualizam",
                  "Prejuízo oculto em taxas e impostos",
                  "Vendas canceladas por falta de estoque",
                  "Sem visão clara do lucro real"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Markthub Card */}
            <motion.div
              whileHover={{ y: -10 }}
              className="p-12 rounded-3xl bg-white border border-purple-100 shadow-xl shadow-purple-500/5 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white"><CheckCircle2 className="w-4 h-4" /></span>
                  Com Markthub
                </h3>
                <ul className="space-y-4">
                  {[
                    "Dashboard financeiro automático",
                    "Lucro líquido calculado (ML + Impostos)",
                    "Sincronização multi-canal instantânea",
                    "Previsibilidade de crescimento"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-900 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Ecosystem Section --- */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">Um Ecossistema <br />de <span className="text-purple-600">Alta Performance</span></h2>
              <p className="text-zinc-500 max-w-md">Ferramentas profissionais projetadas para quem fatura alto ou quer chegar lá.</p>
            </div>
            <Button variant="outline" className="rounded-full">Ver todas as funcionalidades</Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Settings, title: "Hub Central", desc: "Controle ML, Shopee e Amazon em uma única tela.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: Shield, title: "Anti-Fraude", desc: "Proteção contra compras suspeitas e bloqueios.", color: "text-green-600", bg: "bg-green-50" },
              { icon: Zap, title: "Automação", desc: "Respostas automáticas com IA em <300ms.", color: "text-yellow-600", bg: "bg-yellow-50" },
              { icon: Gauge, title: "Analytics", desc: "Métricas profundas de conversão e anúncios.", color: "text-purple-600", bg: "bg-purple-50" },
              { icon: TrendingUp, title: "Precificação", desc: "Ajuste automático de preços por concorrente.", color: "text-pink-600", bg: "bg-pink-50" },
              { icon: ChevronRight, title: "E muito mais", desc: "Mais de 40 ferramentas integradas.", color: "text-zinc-600", bg: "bg-zinc-50" }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl border border-zinc-100 bg-white hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-zinc-900">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
              Pronto para <br /><span className="text-purple-400">Escalar?</span>
            </h2>
            <p className="text-xl text-zinc-400">
              Junte-se à elite dos vendedores de marketplace.
              Cancele quando quiser. Sem fidelidade.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <MagneticButton
                onClick={() => setLocation("/cadastro")}
                className="h-20 px-12 bg-white text-zinc-900 rounded-full font-bold text-xl shadow-2xl hover:bg-zinc-100 transition-colors"
              >
                Começar Trial Gratuito
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-white border-t border-zinc-100 py-20 text-zinc-500">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-20">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold">M</div>
                <span className="font-bold text-zinc-900">Markthub</span>
              </div>
              <p className="text-sm max-w-xs">Tecnologia de ponta para e-commerce profissional.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-sm">
              {[
                { title: "Produto", links: ["Funcionalidades", "Enterprise", "Segurança", "Changelog"] },
                { title: "Recursos", links: ["Documentação", "API", "Status", "Comunidade"] },
                { title: "Empresa", links: ["Sobre", "Carreiras", "Blog", "Contato"] },
                { title: "Legal", links: ["Privacidade", "Termos", "Cookies", "Licenças"] }
              ].map((col, i) => (
                <div key={i}>
                  <h4 className="font-bold text-zinc-900 mb-4">{col.title}</h4>
                  <ul className="space-y-3">
                    {col.links.map((link, j) => (
                      <li key={j}><a href="#" className="hover:text-purple-600 transition-colors">{link}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2025 Markthub CRM inc. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-zinc-900">Twitter</a>
              <a href="#" className="hover:text-zinc-900">LinkedIn</a>
              <a href="#" className="hover:text-zinc-900">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
