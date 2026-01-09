import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { calculateMLFees } from '@/data/mercado-livre-fees';
import { Calculator, ArrowRight, TrendingUp } from 'lucide-react';
import { useLocation } from "wouter";

export default function HeroCalculator() {
    const [, setLocation] = useLocation();
    const [salePrice, setSalePrice] = useState<string>('129.00');
    const [result, setResult] = useState<any>(null);

    const calculate = (price: string) => {
        const priceNum = parseFloat(price) || 0;

        // --- CONFIGURAÇÃO ESPECÍFICA DO USUÁRIO ---
        // ML Fee 13% (Overrides standard tables for this specific simulation view)
        const customMLFeeRate = 0.13;
        const categoryFee = priceNum * customMLFeeRate;

        // Taxes
        const icmsRate = 0.19; // Goiás 19%
        const simplesRate = 0.065; // Simples 6.5%
        const pixFeeRate = 0.0099; // Pix 0.99%

        const icmsCost = priceNum * icmsRate;
        const simplesCost = priceNum * simplesRate;
        const paymentFee = priceNum * pixFeeRate;

        // Demo Shipping (avg for 350g)
        const shippingCost = 18.00; // Average fixed for demo

        const totalTaxes = icmsCost + simplesCost;
        const totalFees = categoryFee + shippingCost + paymentFee + totalTaxes;
        const netRevenue = priceNum - totalFees;
        const netMargin = (netRevenue / priceNum) * 100;

        setResult({
            categoryFee,
            shippingCost,
            icmsCost,
            simplesCost,
            paymentFee,
            totalFees,
            netRevenue,
            netMargin
        });
    };

    useEffect(() => {
        calculate(salePrice);
    }, []);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSalePrice(value);
        calculate(value);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <div className="relative w-full max-w-md mx-auto font-sans">
            {/* Decorative Top Bar */}
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex gap-1">
                    <div className="w-16 h-1 bg-purple-600" />
                    <div className="w-4 h-1 bg-purple-400" />
                    <div className="w-1 h-1 bg-purple-200" />
                </div>
                <span className="text-[10px] font-mono text-purple-600 tracking-widest uppercase">Simulador de Lucro</span>
            </div>

            <Card className="relative overflow-hidden bg-white border border-zinc-200 rounded-xl shadow-2xl">
                {/* Tech Grid Background */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calculator className="w-12 h-12 text-purple-600" />
                </div>

                <CardContent className="pt-8 px-8 pb-8 space-y-6 relative z-10">

                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <Label htmlFor="hero-price" className="text-zinc-400 font-mono text-xs tracking-wider uppercase">Input // Preço de Venda</Label>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>

                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xl">R$</span>
                            <Input
                                id="hero-price"
                                type="number"
                                value={salePrice}
                                onChange={handlePriceChange}
                                className="pl-12 h-16 text-4xl font-black bg-zinc-50 border-zinc-200 focus:border-purple-600 text-zinc-900 transition-all rounded-lg font-sans tracking-tight focus:ring-1 focus:ring-purple-600/20"
                            />
                        </div>
                    </div>

                    {result && (
                        <div className="space-y-4">
                            {/* Breakdown List */}
                            <div className="space-y-2 text-xs text-zinc-500 font-mono border-t border-b border-zinc-100 py-4">
                                <div className="flex justify-between">
                                    <span>Comissão ML (13%)</span>
                                    <span className="text-red-500">-{formatCurrency(result.categoryFee)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ICMS Goiás (19%)</span>
                                    <span className="text-red-500">-{formatCurrency(result.icmsCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Simples Nac. (6.5%)</span>
                                    <span className="text-red-500">-{formatCurrency(result.simplesCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Taxa Pix (0.99%)</span>
                                    <span className="text-red-500">-{formatCurrency(result.paymentFee)}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-2 border-t border-zinc-100 text-zinc-700">
                                    <span>Total Taxas</span>
                                    <span className="text-red-600">-{formatCurrency(result.totalFees)}</span>
                                </div>
                            </div>

                            {/* Net Revenue */}
                            <div className="bg-green-50 rounded-lg p-4 flex justify-between items-center border border-green-100">
                                <div>
                                    <p className="text-[10px] text-green-600 font-mono uppercase tracking-wider mb-1">Lucro Líquido Real</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                        <p className="text-2xl font-black text-green-700 font-mono">
                                            {formatCurrency(result.netRevenue)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            className="w-full h-12 text-sm font-bold uppercase tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-transform active:scale-[0.99] shadow-lg shadow-zinc-200"
                            onClick={() => setLocation("/calculadora-ml")}
                        >
                            Ver Detalhes do Cálculo
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
