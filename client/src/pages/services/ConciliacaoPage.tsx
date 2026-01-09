import { Button } from "@/components/ui/button";
import { MegaMenu } from "@/components/layout/MegaMenu";
import ChatGemini from '@/components/ChatGemini';
import { useLocation } from "wouter";
import { CheckCircle2, ChevronDown, ChevronUp, Wallet, DollarSign, FileText } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ConciliacaoPage() {
    const [, setLocation] = useLocation();

    // FAQ State
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i);

    return (
        <div className="min-h-screen flex flex-col bg-white text-zinc-900 font-sans selection:bg-purple-100 selection:text-purple-900">
            <ChatGemini autoOpen={false} />

            {/* Header */}
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

                        {/* Text Content */}
                        <div className="lg:w-1/2 space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                                Finanças Automatizadas
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 leading-tight">
                                Conciliação Bancária <span className="text-green-600">Sem Erros</span>
                            </h1>
                            <p className="text-xl text-zinc-500 leading-relaxed">
                                Pare de perder dinheiro com taxas indevidas. O Markthub audita cada centavo que o Mercado Livre deposita na sua conta.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Confronto automático: Vendas vs. Repasses",
                                    "Identificação de taxas cobradas duplicadas",
                                    "Relatório de divergências financeiras",
                                    "Previsão exata de fluxo de caixa futuro"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-700 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-6">
                                <Button
                                    onClick={() => setLocation("/cadastro")}
                                    className="h-14 px-8 bg-zinc-900 text-white text-lg rounded-xl hover:bg-zinc-800 shadow-lg shadow-zinc-200"
                                >
                                    Começar Auditoria Grátis
                                </Button>
                                <p className="mt-4 text-sm text-zinc-400">Recupere em média R$ 2.000/mês em taxas indevidas.</p>
                            </div>
                        </div>

                        {/* Visual Representation */}
                        <div className="lg:w-1/2 w-full">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-green-100 to-purple-100 rounded-[3rem] blur-3xl opacity-50" />
                                <div className="relative bg-white p-8 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-zinc-100">
                                    <div className="space-y-6">
                                        {/* Mockup Items */}
                                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><DollarSign /></div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">Repasse ML #99283</p>
                                                    <p className="text-sm text-zinc-500">Hoje, 14:30</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-green-600">+ R$ 14.230,00</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600"><FileText /></div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">Divergência Detectada</p>
                                                    <p className="text-sm text-red-600">Taxa de envio cobrada 2x</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="destructive" className="rounded-full">Contestar</Button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 opacity-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-500"><Wallet /></div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">Saldo Disponível</p>
                                                    <p className="text-sm text-zinc-500">Mercado Pago</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-zinc-900">R$ 45.200,00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEO Body */}
                    <div className="max-w-3xl mx-auto mt-32 space-y-16">
                        <section>
                            <h2 className="text-3xl font-bold mb-6">O que é Conciliação Financeira para E-commerce?</h2>
                            <div className="prose prose-lg text-zinc-500">
                                <p>
                                    Vender em marketplaces envolve dezenas de micro-taxas: comissão, taxa fixa, frete, impostos, ads...
                                    Fazer esse controle em planilhas é impossível quando se escala.
                                </p>
                                <p className="mt-4">
                                    A conciliação automática do Markthub cruza os dados do pedido (quanto deveria ser cobrado) com o extrato financeiro (quanto foi realmente descontado), alertando você sobre qualquer discrepância para que possa abrir chamados e recuperar seu dinheiro.
                                </p>
                            </div>
                        </section>
                    </div>

                </div>
            </main>

            <footer className="py-12 bg-zinc-50 border-t border-zinc-200 text-center">
                <p className="text-zinc-400 text-sm">© 2025 Markthub. Sistema de Gestão Financeira.</p>
            </footer>
        </div>
    );
}
