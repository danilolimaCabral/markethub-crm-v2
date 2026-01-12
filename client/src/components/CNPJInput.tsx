import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  situacao: string;
}

interface CNPJInputProps {
  value: string;
  onChange: (value: string) => void;
  onDataFetched?: (data: CNPJData) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function CNPJInput({ 
  value, 
  onChange, 
  onDataFetched, 
  disabled = false,
  required = false 
}: CNPJInputProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Formata CNPJ enquanto digita
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    onChange(formatted);
    setStatus('idle');
  };

  const handleBlur = async () => {
    const cnpjNumbers = value.replace(/\D/g, '');
    
    // Só valida se tiver 14 dígitos
    if (cnpjNumbers.length === 14) {
      await buscarCNPJ();
    }
  };

  const buscarCNPJ = async () => {
    const cnpjNumbers = value.replace(/\D/g, '');
    
    if (cnpjNumbers.length !== 14) {
      toast.error('CNPJ deve conter 14 dígitos');
      setStatus('invalid');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const response = await axios.get(`/api/cnpj/${cnpjNumbers}`);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Verifica situação cadastral
        if (data.situacao !== 'ATIVA') {
          toast.warning(`Empresa encontrada, mas situação: ${data.situacao}`);
        } else {
          toast.success('Dados da empresa carregados com sucesso!');
        }
        
        setStatus('valid');
        
        // Chama callback com os dados
        if (onDataFetched) {
          onDataFetched(data);
        }
      } else {
        toast.error(response.data.error || 'CNPJ não encontrado');
        setStatus('invalid');
      }
    } catch (error: any) {
      console.error('Erro ao buscar CNPJ:', error);
      
      if (error.response?.status === 404) {
        toast.error('CNPJ não encontrado na base da Receita Federal');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.error || 'CNPJ inválido');
      } else {
        toast.error('Erro ao consultar CNPJ. Tente novamente.');
      }
      
      setStatus('invalid');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (status === 'valid') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (status === 'invalid') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="cnpj">
        CNPJ {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="cnpj"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            disabled={disabled || loading}
            required={required}
            className={`pr-10 ${
              status === 'valid' ? 'border-green-500' : 
              status === 'invalid' ? 'border-red-500' : ''
            }`}
          />
          {getStatusIcon() && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getStatusIcon()}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={buscarCNPJ}
          disabled={disabled || loading || value.replace(/\D/g, '').length !== 14}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Digite o CNPJ e clique em buscar ou pressione Tab para carregar os dados automaticamente
      </p>
    </div>
  );
}
