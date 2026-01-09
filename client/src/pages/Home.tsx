import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowRight, CheckCircle2, Moon, Settings, Sun, Zap, Shield, Gauge, MessageSquare, Send, Github, Twitter, Linkedin, MousePointer2 } from "lucide-react";
import { useLocation } from "wouter";
import HeroCalculator from "@/components/HeroCalculator";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const MagneticButton = ({ children, className, onClick, variant = "primary" }: any) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseLine = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.3);
    y.set((clientY - centerY) * 0.3);
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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { scrollY } = useScroll();

  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Mouse trail for background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const backgroundGradient = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(124, 58, 237, 0.15), transparent 80%)`;

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Configuração Rápida",
      description: "Configure sua integração em menos de 5 minutos com nosso assistente interativo"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Seguro e Confiável",
      description: "Suas credenciais são armazenadas localmente e nunca compartilhadas"
    },
    {
      icon: <Gauge className="w-6 h-6" />,
      title: "Testes em Tempo Real",
      description: "Teste endpoints e valide sua integração antes de usar"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-primary/30 overflow-x-hidden">
      {/* Interactive Background */}
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: backgroundGradient }}
      />
      <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 180 }}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)]"
            >
              <span className="text-white font-black text-xl italic">M</span>
            </motion.div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Markthub CRM</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-white/10"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            style={{ y: heroY, opacity }}
            className="flex flex-col items-center justify-center text-center space-y-12"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-[0.2em]">System v2.0 Online</span>
            </motion.div>

            {/* Massive Text Revealed */}
            <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter italic uppercase leading-[0.8] mix-blend-screen">
              <motion.span
                initial={{ y: 100, opacity: 0, skewX: 20 }}
                animate={{ y: 0, opacity: 1, skewX: -4 }}
                transition={{ duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] }}
                className="block text-zinc-800"
              >
                Domine
              </motion.span>
              <div className="relative">
                <motion.span
                  initial={{ y: 100, opacity: 0, skewX: -20 }}
                  animate={{ y: 0, opacity: 1, skewX: -4 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.65, 0.3, 0.9] }}
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-primary animate-gradient bg-[length:200%_auto]"
                >
                  Mercado
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute -right-12 top-0 text-2xl md:text-4xl text-white font-mono opacity-50 rotate-90 origin-left"
                >
                  LIVRE
                </motion.span>
              </div>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl md:text-2xl text-zinc-400 max-w-2xl font-light"
            >
              A primeira plataforma de <span className="text-white font-medium">Auto-Performance</span> do Brasil.
              Sincronização em tempo real. Lucro real.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-6"
            >
              <MagneticButton
                onClick={() => setLocation("/setup")}
                className="group relative px-10 py-5 bg-primary overflow-hidden rounded-none skew-x-[-12deg]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-3 text-xl font-black italic uppercase tracking-widest text-white skew-x-[12deg]">
                  Começar Agora <ArrowRight className="w-5 h-5" />
                </span>
              </MagneticButton>
            </motion.div>

            {/* Floating Calculator */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="pt-12 w-full max-w-xl perspective-1000"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotateX: [0, 5, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                <HeroCalculator />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Diagnosis Section */}
      <section className="container mx-auto px-4 py-40">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 space-y-4"
        >
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">
            Diagnóstico de <span className="text-primary">Performance</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            A diferença entre sobreviver e dominar o mercado.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Chaos Card */}
          <motion.div
            whileHover={{ scale: 0.98, opacity: 0.8 }}
            className="relative p-12 rounded-3xl bg-zinc-900/50 border border-red-500/20 overflow-hidden group transition-all duration-500 hover:border-red-500/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="text-red-500">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-300">Sua Realidade Atual</h3>
              </div>
              <ul className="space-y-6">
                {[
                  "Planilhas desatualizadas e erros manuais",
                  "Prejuízo com taxas ocultas",
                  "Estoque furado e reclamações",
                  "Horas perdidas calculando margem",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 text-zinc-500"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500/50" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Order Card (Markthub) */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/30 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-primary/5 blur-[50px] group-hover:bg-primary/10 transition-colors duration-500" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary rounded-lg text-white shadow-lg shadow-primary/50">
                  <Gauge className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Com Markthub CRM</h3>
              </div>

              <ul className="space-y-6">
                {[
                  "Dashboard unificado em tempo real",
                  "Cálculo automático de lucro líquido",
                  "Sincronização instantânea de estoque",
                  "Automação que roda 24/7 por você",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 text-white font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    {item}
                  </motion.li>
                ))}
              </ul>

              <motion.div className="pt-10" whileHover={{ x: 10 }}>
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto text-lg font-bold"
                  onClick={() => setLocation("/setup")}
                >
                  Ver todas as vantagens
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Motion Ecosystem Section */}
      <section className="container mx-auto px-4 py-32 relative">
        <div className="text-center mb-20 space-y-4">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white"
          >
            Ecossistema de <span className="text-primary">Potência</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">

          {/* Main Feature - Large Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="md:col-span-2 md:row-span-2 relative h-[500px] rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

            <div className="relative z-10 p-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-primary/20 rounded-xl text-primary">
                    <Settings className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Central de Controle</h3>
                </div>
                <p className="text-zinc-400 max-w-md">Gerencie múltiplas contas do Mercado Livre, Shopee e Amazon em um único lugar.</p>
              </div>

              {/* Simulated UI */}
              <div className="w-full bg-[#0A0A0B] rounded-t-xl border-t border-x border-white/10 p-4 shadow-2xl translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-3/4 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-2 w-1/2 bg-zinc-800 rounded animate-pulse delay-75" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side Feature 1 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="relative p-8 rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden"
          >
            <Zap className="w-8 h-8 text-yellow-400 mb-6" />
            <h3 className="text-xl font-bold mb-2">Respostas Rápidas</h3>
            <p className="text-zinc-500 text-sm">IA treinada responder perguntas em 300ms.</p>
          </motion.div>

          {/* Side Feature 2 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="relative p-8 rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden"
          >
            <Shield className="w-8 h-8 text-green-400 mb-6" />
            <h3 className="text-xl font-bold mb-2">Anti-Bloqueio</h3>
            <p className="text-zinc-500 text-sm">Proteção de conta e reputação 24/7.</p>
          </motion.div>

          {/* Bottom Wide Feature */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3 rounded-3xl bg-gradient-to-r from-primary to-purple-800 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 mix-blend-overlay" />
            <div className="p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-black italic uppercase">Acelere suas Vendas</h3>
                <p className="text-white/80 max-w-lg">
                  Nossos usuários relatam um aumento médio de 32% no faturamento nos primeiros 3 meses.
                </p>
              </div>
              <Button
                onClick={() => setLocation("/setup")}
                className="bg-white text-black hover:bg-zinc-200 font-bold px-8 py-6 rounded-xl text-lg"
              >
                Ver Plano de Aceleração <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Magnetic CTA Section */}
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <motion.div
          className="absolute -right-[20%] top-0 w-[600px] h-[600px] bg-primary/20 blur-[200px] rounded-full mix-blend-screen"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        <div className="container relative mx-auto px-4">
          <div className="relative overflow-hidden bg-black border border-white/10 p-12 lg:p-24 shadow-2xl skew-y-1">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 skew-y-[-1deg]">
              <div className="text-center md:text-left space-y-8">
                <motion.h3
                  initial={{ x: -100, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none"
                >
                  READY TO <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">RACE?</span>
                </motion.h3>
                <p className="text-2xl text-zinc-400 max-w-lg font-light">
                  Join the elite performance tier of marketplace sellers today.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="flex flex-col sm:flex-row gap-6"
              >
                <MagneticButton
                  onClick={() => setLocation("/setup")}
                  className="h-24 px-16 text-3xl font-black uppercase tracking-widest bg-white text-black hover:bg-zinc-200 rounded-none skew-x-[-12deg] transition-all shadow-xl hover:shadow-white/20"
                >
                  <span className="skew-x-[12deg]">Start Now</span>
                </MagneticButton>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black text-zinc-500 pt-32 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24">
            <div className="col-span-2 md:col-span-1 space-y-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl">L</div>
              <p className="text-sm leading-relaxed max-w-xs">
                Performance extrema para quem não aceita perder vendas.
              </p>
            </div>

            {[
              { title: "Produto", links: ["Features", "Security", "Enterprise", "Changelog"] },
              { title: "Recursos", links: ["Docs", "API", "Status", "Community"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">{col.title}</h4>
                <ul className="space-y-4 text-sm">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="hover:text-primary transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono uppercase tracking-widest">
            <p>© 2025 Markthub CRM. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Politica de Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
