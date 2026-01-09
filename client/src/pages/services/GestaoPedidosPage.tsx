import { Button } from "@/components/ui/button";
import { MegaMenu } from "@/components/layout/MegaMenu";
import ChatGemini from '@/components/ChatGemini';
import { useLocation } from "wouter";
import { CheckCircle2, ChevronDown, ChevronUp, Package, Truck, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function GestaoPedidosPage() {
    const [, setLocation] = useLocation();

    return (
        <div className="min-h-screen flex flex-col bg-white text-zinc-900 font-sans selection:bg-purple-100 selection:text-purple-900">
            <ChatGemini autoOpen={false} />

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

                        <div className="lg:w-1/2 space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                                Operação Centralizada
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 leading-tight">
                                Gestão de Pedidos <span className="text-blue-600">Multi-Canal</span>
                            </h1>
                            <p className="text-xl text-zinc-500 leading-relaxed">
                                Mercado Livre, Shopee e Amazon em um único lugar. Emita notas fiscais e etiquetas de envio em massa sem trocar de aba.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Centralização automática de pedidos (ML, Shopee, Amz)",
                                    "Emissão de NF-e ilimitada e automática",
                                    "Impressão de etiquetas de envio (ZPL/PDF)",
                                    "Baixa automática de estoque multi-canal"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-700 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-6">
                                <Button
                                    onClick={() => setLocation("/cadastro")}
                                    className="h-14 px-8 bg-zinc-900 text-white text-lg rounded-xl hover:bg-zinc-800 shadow-lg shadow-zinc-200"
                                >
                                    Centralizar Minha Operação
                                </Button>
                                <p className="mt-4 text-sm text-zinc-400">Economize até 4h por dia de trabalho manual.</p>
                            </div>
                        </div>

                        <div className="lg:w-1/2 w-full">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-[3rem] blur-3xl opacity-50" />
                                <div className="relative bg-white p-8 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-zinc-100">
                                    <div className="space-y-4">
                                        {[
                                            { store: "Mercado Livre", id: "#MLB-29384", icon: ShoppingBag, color: "text-yellow-600", bg: "bg-yellow-100" },
                                            { store: "Shopee", id: "#SHO-99281", icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-100" },
                                            { store: "Amazon", id: "#AMZ-11234", icon: ShoppingBag, color: "text-zinc-600", bg: "bg-zinc-100" }
                                        ].map((order, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 ${order.bg} rounded-full flex items-center justify-center ${order.color}`}><order.icon className="w-5 h-5" /></div>
                                                    <div>
                                                        <p className="font-bold text-zinc-900">Pedido {order.id}</p>
                                                        <p className="text-xs text-zinc-400">{order.store} • Aguardando Envio</p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" className="text-xs">Gerar etiqueta</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
