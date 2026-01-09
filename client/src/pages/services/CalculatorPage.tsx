import { Button } from "@/components/ui/button";
import HeroCalculator from "@/components/HeroCalculator";
import { MegaMenu } from "@/components/layout/MegaMenu";
import ChatGemini from '@/components/ChatGemini';
import { useLocation } from "wouter";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function CalculatorPage() {
    const [, setLocation] = useLocation();

    // FAQ State
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i);

    return (
        <div className="min-h-screen flex flex-col bg-white text-zinc-900 font-sans selection:bg-purple-100 selection:text-purple-900">
            <ChatGemini autoOpen={false} />

            {/* Header (Reused) */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
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
                        <Button variant="ghost" onClick={() => setLocation("/login")}>Entrar</Button>
                        <Button onClick={() => setLocation("/cadastro")} className="bg-zinc-900 text-white rounded-full">Criar Conta</Button>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">

                        {/* SEO Content Text */}
                        <div className="lg:w-1/2 space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                                Ferramenta Gratuita 2025
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 leading-tight">
                                Calculadora de Lucro <span className="text-purple-600">Mercado Livre</span>
                            </h1>
                            <p className="text-xl text-zinc-500 leading-relaxed">
                                Descubra exatamente quanto sobra no seu bolso. Nossa calculadora atualizada desconta automaticamente:
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Comissão do Mercado Livre (Clássico e Premium)",
                                    "Custos de Frete (Mercado Envios)",
                                    "Imposto ICMS (Cálculo automático por estado)",
                                    "Taxas de Pagamento e Antecipação"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-700 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-6">
                                <Button
                                    onClick={() => setLocation("/cadastro")}
                                    className="h-14 px-8 bg-zinc-900 text-white text-lg rounded-xl hover:bg-zinc-800 shadow-lg shadow-zinc-200"
                                >
                                    Quero Automatizar Meus Cálculos
                                </Button>
                                <p className="mt-4 text-sm text-zinc-400">Teste grátis por 7 dias. Não pede cartão.</p>
                            </div>
                        </div>

                        {/* Interactive Tool */}
                        <div className="lg:w-1/2 w-full">
                            <div className="bg-white p-2 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.1)] border border-zinc-100 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                <HeroCalculator />
                            </div>
                        </div>
                    </div>

                    {/* SEO Content Body */}
                    <div className="max-w-3xl mx-auto mt-32 space-y-16">

                        <section>
                            <h2 className="text-3xl font-bold mb-6">Como calcular a taxa do Mercado Livre em 2025?</h2>
                            <div className="prose prose-lg text-zinc-500">
                                <p>
                                    Vender no Mercado Livre é lucrativo, mas as taxas podem confundir até vendedores experientes.
                                    A margem de lucro não é apenas <code>Preço de Venda - Custo</code>.
                                    Você precisa considerar custos fixos por venda, peso dimensional do pacote e a sua reputação (MercadoLíderes têm descontos no frete).
                                </p>
                                <p className="mt-4">
                                    O <strong>Markthub</strong> simplifica isso conectando-se diretamente à API do Mercado Livre para puxar essas taxas em tempo real para cada um dos seus anúncios, garantindo que você nunca tenha prejuízo sem perceber.
                                </p>
                            </div>
                        </section>

                        {/* FAQ Schema Structured Data Candidate */}
                        <section>
                            <h2 className="text-3xl font-bold mb-8">Perguntas Frequentes</h2>
                            <div className="space-y-4">
                                {[
                                    { q: "Qual a porcentagem do Mercado Livre 2025?", a: "As taxas variam entre 10% e 19% dependendo da categoria (Clássico vs Premium). Nossa calculadora usa a tabela atualizada automaticamente." },
                                    { q: "Como calcular o ICMS no Mercado Livre?", a: "O ICMS varia de estado para estado (ex: 18% em SP). O Markthub permite configurar sua alíquota para descontar isso do lucro líquido automaticamente." },
                                    { q: "A calculadora é gratuita?", a: "Sim, esta ferramenta nesta página é 100% gratuita. Para automatizar o cálculo para milhares de anúncios, recomendamos o plano Professional do Markthub." }
                                ].map((faq, i) => (
                                    <div key={i} className="border border-zinc-200 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleFaq(i)}
                                            className="w-full flex justify-between items-center p-6 text-left bg-white hover:bg-zinc-50 font-semibold text-zinc-900"
                                        >
                                            {faq.q}
                                            {openFaq === i ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                                        </button>
                                        {openFaq === i && (
                                            <div className="p-6 pt-0 bg-white text-zinc-600 leading-relaxed border-t border-zinc-100">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                </div>
            </main>

            {/* Simple Footer */}
            <footer className="py-12 bg-zinc-50 border-t border-zinc-200 text-center">
                <p className="text-zinc-400 text-sm">© 2025 Markthub. Ferramenta de cálculo otimizada para SEO.</p>
            </footer>
        </div>
    );
}
