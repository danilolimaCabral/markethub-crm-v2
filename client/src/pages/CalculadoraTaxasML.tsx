import CRMLayout from '@/components/CRMLayout';
import MLFeesCalculator from '@/components/MLFeesCalculator';

export default function CalculadoraTaxasML() {
  return (
    <CRMLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calculadora de Taxas Mercado Livre</h1>
          <p className="text-muted-foreground mt-2">
            Calcule automaticamente todas as taxas, comissões e custos do Mercado Livre
          </p>
        </div>

        <MLFeesCalculator />
      </div>
    </CRMLayout>
  );
}
