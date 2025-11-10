import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { verifyTOTP } from '@/lib/totp';

export default function Verify2FA() {
  const [, setLocation] = useLocation();
  const [verificationCode, setVerificationCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (verificationCode.length === 0) {
      toast.error('Digite o código de verificação');
      return;
    }

    setIsVerifying(true);

    try {
      // Pegar dados temporários do login
      const tempUser = JSON.parse(sessionStorage.getItem('temp_login_user') || '{}');
      
      if (!tempUser.username) {
        toast.error('Sessão expirada. Faça login novamente.');
        setLocation('/');
        return;
      }

      // Pegar usuário completo do localStorage
      const users = JSON.parse(localStorage.getItem('markethub_users') || '[]');
      const user = users.find((u: any) => u.username === tempUser.username);

      if (!user || !user.twoFactorEnabled) {
        toast.error('Erro ao verificar 2FA');
        setLocation('/');
        return;
      }

      let isValid = false;

      if (useBackupCode) {
        // Verificar código de backup
        const backupCodes = user.backupCodes || [];
        const codeIndex = backupCodes.indexOf(verificationCode.toUpperCase());
        
        if (codeIndex !== -1) {
          // Código válido - remover da lista
          backupCodes.splice(codeIndex, 1);
          user.backupCodes = backupCodes;
          
          // Atualizar no localStorage
          const userIndex = users.findIndex((u: any) => u.username === user.username);
          users[userIndex] = user;
          localStorage.setItem('markethub_users', JSON.stringify(users));
          
          isValid = true;
          toast.info('Código de backup usado. Restam ' + backupCodes.length + ' códigos.');
        }
      } else {
        // Verificar código TOTP
        isValid = await verifyTOTP(user.twoFactorSecret, verificationCode);
      }

      if (isValid) {
        // Login bem-sucedido
        localStorage.setItem('markethub_user', JSON.stringify(user));
        sessionStorage.removeItem('temp_login_user');
        
        toast.success('Login realizado com sucesso!');
        setLocation('/dashboard');
      } else {
        toast.error(useBackupCode ? 'Código de backup inválido' : 'Código inválido. Tente novamente.');
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast.error('Erro ao verificar código');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('temp_login_user');
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-800 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4 mx-auto">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-white text-2xl">
            Verificação de 2 Fatores
          </CardTitle>
          <CardDescription className="text-gray-400">
            {useBackupCode
              ? 'Digite um código de backup'
              : 'Digite o código do seu aplicativo autenticador'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-300">
              {useBackupCode ? 'Código de Backup' : 'Código de Verificação'}
            </Label>
            <Input
              type="text"
              maxLength={useBackupCode ? 9 : 6}
              value={verificationCode}
              onChange={(e) => {
                const value = useBackupCode
                  ? e.target.value.toUpperCase()
                  : e.target.value.replace(/\D/g, '');
                setVerificationCode(value);
              }}
              placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
              className="bg-gray-800 border-gray-700 text-white text-center text-2xl tracking-widest font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerify();
                }
              }}
            />
          </div>

          {!useBackupCode && (
            <Alert className="bg-blue-900/30 border-blue-800">
              <AlertDescription className="text-gray-300 text-sm">
                O código muda a cada 30 segundos. Digite o código atual exibido no seu app.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleVerify}
            disabled={verificationCode.length === 0 || isVerifying}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isVerifying ? 'Verificando...' : 'Verificar'}
          </Button>

          <div className="text-center">
            <button
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setVerificationCode('');
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {useBackupCode
                ? 'Usar código do autenticador'
                : 'Usar código de backup'}
            </button>
          </div>

          <Button
            variant="ghost"
            onClick={handleCancel}
            className="w-full text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
