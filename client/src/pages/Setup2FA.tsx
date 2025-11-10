import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Copy, Check, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { generateSecret, generateQRCodeURL, generateBackupCodes, verifyTOTP } from '@/lib/totp';

export default function Setup2FA() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [secret, setSecret] = useState('');
  const [qrCodeURL, setQrCodeURL] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Gerar secret e QR Code ao montar componente
  useEffect(() => {
    const newSecret = generateSecret();
    setSecret(newSecret);

    // Pegar nome do usuário do localStorage
    const user = JSON.parse(localStorage.getItem('markethub_user') || '{}');
    const accountName = user.username || 'admin';

    // Gerar URL do QR Code
    const url = generateQRCodeURL(newSecret, accountName);

    // Gerar imagem do QR Code
    QRCode.toDataURL(url, { width: 300, margin: 2 })
      .then(setQrCodeURL)
      .catch(console.error);

    // Gerar códigos de backup
    setBackupCodes(generateBackupCodes());
  }, []);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success('Secret copiado!');
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackup(true);
    toast.success('Códigos de backup copiados!');
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const text = `MarketHub CRM - Códigos de Backup 2FA\n\n${backupCodes.join('\n')}\n\nGuarde estes códigos em local seguro. Cada código pode ser usado apenas uma vez.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ia-bruno-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Códigos baixados!');
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Digite um código de 6 dígitos');
      return;
    }

    setIsVerifying(true);

    try {
      const isValid = await verifyTOTP(secret, verificationCode);

      if (isValid) {
        // Salvar configuração 2FA no localStorage
        const user = JSON.parse(localStorage.getItem('markethub_user') || '{}');
        user.twoFactorEnabled = true;
        user.twoFactorSecret = secret;
        user.backupCodes = backupCodes;
        localStorage.setItem('markethub_user', JSON.stringify(user));

        toast.success('2FA configurado com sucesso!');
        setStep('backup');
      } else {
        toast.error('Código inválido. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast.error('Erro ao verificar código');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinish = () => {
    toast.success('Autenticação de 2 fatores ativada!');
    setLocation('/configuracoes');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Autenticação de 2 Fatores
          </h1>
          <p className="text-gray-300">
            Adicione uma camada extra de segurança à sua conta
          </p>
        </div>

        {/* Step 1: Setup */}
        {step === 'setup' && (
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">1. Configure seu Autenticador</CardTitle>
              <CardDescription className="text-gray-400">
                Escaneie o QR Code com seu aplicativo autenticador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                {qrCodeURL && (
                  <div className="bg-white p-4 rounded-lg">
                    <img src={qrCodeURL} alt="QR Code 2FA" className="w-64 h-64" />
                  </div>
                )}
              </div>

              {/* Secret Manual */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Ou digite manualmente o código:
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={secret}
                    readOnly
                    className="bg-gray-800 border-gray-700 text-white font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                    className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                  >
                    {copiedSecret ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Apps Recomendados */}
              <Alert className="bg-blue-900/30 border-blue-800">
                <AlertDescription className="text-gray-300">
                  <strong className="text-white">Apps recomendados:</strong>
                  <br />
                  • Google Authenticator
                  <br />
                  • Microsoft Authenticator
                  <br />
                  • Authy
                  <br />• 2FAS
                </AlertDescription>
              </Alert>

              {/* Botão Próximo */}
              <Button
                onClick={() => setStep('verify')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Próximo: Verificar Código
              </Button>

              <Button
                variant="ghost"
                onClick={() => setLocation('/configuracoes')}
                className="w-full text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Verify */}
        {step === 'verify' && (
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">2. Verifique o Código</CardTitle>
              <CardDescription className="text-gray-400">
                Digite o código de 6 dígitos do seu aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-300">Código de Verificação</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="bg-gray-800 border-gray-700 text-white text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <Alert className="bg-yellow-900/30 border-yellow-800">
                <AlertDescription className="text-gray-300">
                  O código muda a cada 30 segundos. Digite o código atual exibido no seu app.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isVerifying ? 'Verificando...' : 'Verificar e Ativar 2FA'}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep('setup')}
                className="w-full text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Backup Codes */}
        {step === 'backup' && (
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">3. Códigos de Backup</CardTitle>
              <CardDescription className="text-gray-400">
                Guarde estes códigos em local seguro. Use-os se perder acesso ao seu autenticador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Códigos */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm text-gray-300">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-500">{index + 1}.</span>
                      <span>{code}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyBackupCodes}
                  className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  {copiedBackup ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadBackupCodes}
                  className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              </div>

              <Alert className="bg-red-900/30 border-red-800">
                <AlertDescription className="text-gray-300">
                  <strong className="text-red-400">Importante:</strong> Cada código pode ser usado apenas uma vez. Guarde-os em local seguro e offline.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleFinish}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Concluir Configuração
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
