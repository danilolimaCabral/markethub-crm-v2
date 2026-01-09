import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { calculateMLFees, ML_CATEGORIES } from '@/data/mercado-livre-fees';
import { Calculator, ArrowRight, DollarSign, TrendingUp } from 'lucide-react';
import { useLocation } from "wouter";

export default function HeroCalculator() {
    const [, setLocation] = useLocation();
    const [salePrice, setSalePrice] = useState<string>('89.90');
    const [result, setResult] = useState<any>(null);

    const calculate = (price: string) => {
        const fees = calculateMLFees({
            salePrice: parseFloat(price) || 0,
            categoryId: 'MLB1000', // Default category
            listingType: 'classico',
            paymentMethod: 'pix',
            installments: 1,
            weightGrams: 350,
            isMercadoLider: false,
            offerFreeShipping: true,
        });
        setResult(fees);
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
                    <div className="w-16 h-1 bg-primary" />
                    <div className="w-4 h-1 bg-primary/50" />
                    <div className="w-1 h-1 bg-primary/30" />
                </div>
                <span className="text-[10px] font-mono text-primary tracking-widest uppercase">Simulador de Lucro</span>
            </div>

            <Card className="relative overflow-hidden bg-card border border-border/10 rounded-none shadow-2xl">
                {/* Tech Grid Background */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <Calculator className="w-12 h-12 text-primary/10" />
                </div>

                <CardContent className="pt-8 px-8 pb-8 space-y-8 relative z-10">

                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <Label htmlFor="hero-price" className="text-muted-foreground font-mono text-xs tracking-wider uppercase">Input // Preço de Venda</Label>
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>

                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xl">R$</span>
                            <Input
                                id="hero-price"
                                type="number"
                                value={salePrice}
                                onChange={handlePriceChange}
                                className="pl-12 h-16 text-4xl font-black bg-background/50 border-input focus:border-primary text-foreground transition-all rounded-sm font-sans tracking-tight focus:ring-1 focus:ring-primary/50"
                            />
                            {/* Corner Accents */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    {result && (
                        <div className="grid grid-cols-2 gap-px bg-border/10 p-px">
                            <div className="bg-background p-4 space-y-1 group hover:bg-muted/50 transition-colors">
                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Taxas e Custos</p>
                                <p className="text-xl font-bold text-foreground font-mono">
                                    -{formatCurrency(result.totalFees)}
                                </p>
                            </div>

                            <div className="bg-background p-4 space-y-1 relative overflow-hidden group hover:bg-muted/50 transition-colors">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <p className="text-[10px] text-primary font-mono uppercase tracking-wider">Receita Líquida</p>
                                <p className="text-xl font-bold text-primary font-mono flex items-center gap-1">
                                    {formatCurrency(result.netRevenue)}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            className="w-full h-12 text-sm font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-none transition-transform active:scale-[0.99]"
                            onClick={() => setLocation("/calculadora-ml")}
                        >
                            Ver Detalhes
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
