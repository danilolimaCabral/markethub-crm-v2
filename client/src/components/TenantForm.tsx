import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import CNPJInput from './CNPJInput';
import { toast } from 'sonner';
import axios from 'axios';
import { Building2, Mail, Phone, MapPin, Info } from 'lucide-react';

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  cnpj: string;
  nome_empresa: string;
  nome_fantasia: string;
  email_contato: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  plano: string;
  integrations: string[];
}

const integracoesDisponiveis = [
  { value: 'MercadoLivre', label: 'Mercado Livre' },
  { value: 'Shopee', label: 'Shopee' },
  { value: 'Amazon', label: 'Amazon' },
  { value: 'Magalu', label: 'Magazine Luiza' },
  { value: 'Bling', label: 'Bling ERP' },
  { value: 'Omie', label: 'Omie ERP' },
  { value: 'Tiny', label: 'Tiny ERP' },
];

export default function TenantForm({ open, onOpenChange, onSuccess }: TenantFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    cnpj: '',
    nome_empresa: '',
    nome_fantasia: '',
    email_contato: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    plano: 'starter',
    integrations: []
  });

  const handleCNPJDataFetched = (data: any) => {
    setFormData(prev => ({
      ...prev,
      cnpj: data.cnpj,
      nome_empresa: data.razao_social,
      nome_fantasia: data.nome_fantasia,
      email_contato: data.email || prev.email_contato,
      telefone: data.telefone || prev.telefone,
      endereco: data.endereco,
      cidade: data.cidade,
      estado: data.estado,
      cep: data.cep
    }));
  };

  const handleIntegrationToggle = (integration: string) => {
    setFormData(prev => ({
      ...prev,
      integrations: prev.integrations.includes(integration)
        ? prev.integrations.filter(i => i !== integration)
        : [...prev.integrations, integration]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.cnpj || formData.cnpj.replace(/\D/g, '').length !== 14) {
      toast.error('CNPJ inválido');
      return;
    }

    if (!formData.nome_empresa) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    if (!formData.email_contato) {
      toast.error('Email de contato é obrigatório');
      return;
    }

    if (formData.integrations.length === 0) {
      toast.error('Selecione pelo menos uma integração');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/tenants', {
        cnpj: formData.cnpj.replace(/\D/g, ''),
        nome_empresa: formData.nome_empresa,
        email_contato: formData.email_contato,
        telefone: formData.telefone,
        plano: formData.plano,
        integrations: formData.integrations
      });

      if (response.data.success) {
        toast.success('Tenant criado com sucesso!');
        
        // Mostra credenciais do admin
        const credentials = response.data.admin_credentials;
        toast.info(
          `Credenciais do Admin:\nUsuário: ${credentials.username}\nSenha: ${credentials.password}\n\n⚠️ Guarde estas informações!`,
          { duration: 10000 }
        );

        // Reset form
        setFormData({
          cnpj: '',
          nome_empresa: '',
          nome_fantasia: '',
          email_contato: '',
          telefone: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: '',
          plano: 'starter',
          integrations: []
        });

        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Erro ao criar tenant:', error);
      toast.error(error.response?.data?.error || 'Erro ao criar tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Criar Novo Tenant (Cliente)
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente. O CNPJ é obrigatório e buscará os dados automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* CNPJ com busca automática */}
            <CNPJInput
              value={formData.cnpj}
              onChange={(value) => setFormData(prev => ({ ...prev, cnpj: value }))}
              onDataFetched={handleCNPJDataFetched}
              required
            />

            {/* Dados da Empresa */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome_empresa">
                  Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome_empresa"
                  value={formData.nome_empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_empresa: e.target.value }))}
                  placeholder="Empresa Ltda"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <Input
                  id="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_fantasia: e.target.value }))}
                  placeholder="Nome comercial"
                />
              </div>
            </div>

            {/* Contato */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email_contato" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email de Contato <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email_contato"
                  type="email"
                  value={formData.email_contato}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_contato: e.target.value }))}
                  placeholder="contato@empresa.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="endereco" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                  placeholder="00000-000"
                />
              </div>
            </div>

            {/* Plano */}
            <div className="space-y-2">
              <Label htmlFor="plano">Plano</Label>
              <Select
                value={formData.plano}
                onValueChange={(value) => setFormData(prev => ({ ...prev, plano: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter (3 usuários, 100 produtos)</SelectItem>
                  <SelectItem value="professional">Professional (10 usuários, 1000 produtos)</SelectItem>
                  <SelectItem value="business">Business (25 usuários, 2000 produtos)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (Ilimitado)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Integrações */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Integrações <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground">(Selecione pelo menos 1)</span>
              </Label>
              <div className="grid gap-3 md:grid-cols-2">
                {integracoesDisponiveis.map((integracao) => (
                  <div key={integracao.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={integracao.value}
                      checked={formData.integrations.includes(integracao.value)}
                      onCheckedChange={() => handleIntegrationToggle(integracao.value)}
                    />
                    <label
                      htmlFor={integracao.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {integracao.label}
                    </label>
                  </div>
                ))}
              </div>
              {formData.integrations.length > 0 && (
                <p className="text-xs text-green-600">
                  ✓ {formData.integrations.length} integração(ões) selecionada(s)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
