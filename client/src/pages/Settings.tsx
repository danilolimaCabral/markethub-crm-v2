import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { 
  User, 
  Key, 
  Save,
  Palette,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Moon,
  Sun,
  Monitor,
  Shield,
  Lock
} from 'lucide-react';
import { useLocation } from 'wouter';
import { saveAPIConfig, getAPIConfig, isAPIConfigured } from '@/lib/api-config';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  
  // Verificar se 2FA está habilitado
  const [is2FAEnabled, setIs2FAEnabled] = useState(() => {
    const user = JSON.parse(localStorage.getItem('markethub_user') || '{}');
    const users = JSON.parse(localStorage.getItem('markethub_users') || '[]');
    const existingUser = users.find((u: any) => u.username === user.username);
    return existingUser?.twoFactorEnabled || false;
  });

  const handleDisable2FA = () => {
    const user = JSON.parse(localStorage.getItem('markethub_user') || '{}');
    const users = JSON.parse(localStorage.getItem('markethub_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.username === user.username);
    
    if (userIndex !== -1) {
      users[userIndex].twoFactorEnabled = false;
      users[userIndex].twoFactorSecret = null;
      users[userIndex].backupCodes = [];
      localStorage.setItem('markethub_users', JSON.stringify(users));
      setIs2FAEnabled(false);
      toast.success('Autenticação de 2 fatores desativada');
    }
  };
  
  const [apiConfig, setApiConfig] = useState(() => {
    const config = getAPIConfig();
    return {
      integrationKey: config?.integrationKey || '',
      accessToken: config?.accessToken || '',
    };
  });

  const handleSaveAPIConfig = () => {
    if (!apiConfig.integrationKey || !apiConfig.accessToken) {
      toast.error('Preencha todos os campos da API');
      return;
    }

    saveAPIConfig({
      integrationKey: apiConfig.integrationKey,
      accessToken: apiConfig.accessToken,
    });

    toast.success('Configuração da API salva com sucesso! Recarregue a página para ver os dados reais.');
  };

  const isConfigured = isAPIConfigured();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas preferências e integrações
        </p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[700px]">
          <TabsTrigger value="api">
            <Key className="w-4 h-4 mr-2" />
            API Externa
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Integração com API Externa
              </CardTitle>
              <CardDescription>
                Configure as credenciais para conectar com sistemas externos e trazer dados reais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isConfigured && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    ✅ API configurada e ativa! Os dados externos estão sendo sincronizados.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="integrationKey">
                    Integration Key
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="integrationKey"
                    type="text"
                    placeholder="Ex: ZThiY2FjZjItN2I0OC0vMTI4LTk0OVVLZtC5MjRkZWZmZmVk"
                    value={apiConfig.integrationKey}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, integrationKey: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Chave de integração fornecida pelo sistema externo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessToken">
                    Access Token
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="Token de acesso da API"
                    value={apiConfig.accessToken}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token de acesso fornecido pelo sistema externo
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveAPIConfig} className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Configuração
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Como obter as credenciais:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Acesse o sistema externo que deseja integrar</li>
                    <li>Obtenha a Integration Key nas configurações de API</li>
                    <li>Gere um Access Token no portal de autenticação</li>
                    <li>Cole as credenciais acima e clique em Salvar</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>
                Escolha como o sistema deve aparecer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme?.('light')}
                  className="flex-1 gap-2"
                >
                  <Sun className="w-4 h-4" />
                  Claro
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme?.('dark')}
                  className="flex-1 gap-2"
                >
                  <Moon className="w-4 h-4" />
                  Escuro
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Autenticação de 2 Fatores (2FA)
              </CardTitle>
              <CardDescription>
                Adicione uma camada extra de segurança à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {is2FAEnabled ? (
                <>
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      ✅ Autenticação de 2 fatores ativada! Sua conta está protegida.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                      <Lock className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">Proteção Ativa</h4>
                        <p className="text-sm text-muted-foreground">
                          Você precisará do código do seu aplicativo autenticador sempre que fizer login.
                        </p>
                      </div>
                    </div>

                    <Button 
                      variant="destructive" 
                      onClick={handleDisable2FA}
                      className="gap-2"
                    >
                      Desativar 2FA
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      A autenticação de 2 fatores adiciona uma camada extra de segurança, exigindo um código do seu celular além da senha.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-medium">Benefícios:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Proteção contra acesso não autorizado
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Códigos temporários que mudam a cada 30 segundos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Códigos de backup para emergências
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Compatível com Google Authenticator, Authy e outros
                      </li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => setLocation('/setup-2fa')}
                    className="gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Configurar 2FA
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Gerencie suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value="Usuário" disabled />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value="user@markethub.com" disabled />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  As informações de perfil são gerenciadas pelo sistema
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
