import { Button } from "@/components/ui/button";
import { MegaMenu } from "@/components/layout/MegaMenu";
import ChatGemini from '@/components/ChatGemini';
import { useLocation } from "wouter";
import { CheckCircle2, Medal, Zap, LayoutDashboard } from "lucide-react";

export default function MercadoLiderPage() {
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                                Para Vendedores Profissionais
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 leading-tight">
                                Mantenha Sua Medalha <span className="text-green-600">MercadoLíder</span>
                            </h1>
                            <p className="text-xl text-zinc-500 leading-relaxed">
                                Você já vende bem, agora precisa de eficiência. Automatize notas fiscais e mensagens para não perder reputação por atraso.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Emissão automática de NF-e em 2 segundos",
                                    "Mensagens automáticas de pós-venda",
                                    "Gestão de múltiplos CNPJs",
                                    "Relatórios de lucro real (já descontando impostos)"
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
                                    Automatizar Minha Operação
                                </Button>
                            </div>
                        </div>

                        <div className="lg:w-1/2 w-full">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-green-100 to-emerald-100 rounded-[3rem] blur-3xl opacity-50" />
                                <div className="relative bg-white p-8 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-zinc-100 flex items-center justify-center min-h-[400px]">
                                    <Medal className="w-32 h-32 text-green-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
