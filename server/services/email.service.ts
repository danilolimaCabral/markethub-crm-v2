/**
 * Email Service - Serviço de envio de emails
 * 
 * Suporta múltiplos provedores:
 * - SMTP (padrão)
 * - SendGrid
 * - Mailgun
 * - Amazon SES
 */

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const provider = process.env.EMAIL_PROVIDER || 'smtp';

    switch (provider) {
      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
        break;

      case 'mailgun':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          auth: {
            user: process.env.MAILGUN_USER,
            pass: process.env.MAILGUN_PASSWORD
          }
        });
        break;

      default:
        // SMTP padrão
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          } : undefined
        });
    }
  }

  /**
   * Enviar email
   */
  async send(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter não configurado');
      return false;
    }

    try {
      const from = options.from || process.env.EMAIL_FROM || 'Smart Biz360 <noreply@smartbiz360.com>';

      await this.transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments
      });

      console.log(`Email enviado para: ${options.to}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  /**
   * Template: Boas-vindas
   */
  getWelcomeTemplate(data: { 
    companyName: string; 
    userName: string; 
    loginUrl: string;
    credentials?: { username: string; password: string };
  }): EmailTemplate {
    return {
      subject: `Bem-vindo ao Smart Biz360, ${data.companyName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .credentials { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo ao Smart Biz360!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.userName}</strong>,</p>
              
              <p>Sua empresa <strong>${data.companyName}</strong> foi cadastrada com sucesso no Smart Biz360!</p>
              
              <p>Você tem <strong>14 dias de trial gratuito</strong> para explorar todas as funcionalidades da plataforma.</p>
              
              ${data.credentials ? `
              <div class="credentials">
                <strong>⚠️ Suas credenciais de acesso:</strong><br>
                Usuário: <code>${data.credentials.username}</code><br>
                Senha: <code>${data.credentials.password}</code><br>
                <small>Guarde estas informações em local seguro!</small>
              </div>
              ` : ''}
              
              <p style="text-align: center;">
                <a href="${data.loginUrl}" class="button">Acessar o Sistema</a>
              </p>
              
              <p>Se precisar de ajuda, nossa equipe está à disposição.</p>
              
              <p>Atenciosamente,<br>Equipe Smart Biz360</p>
            </div>
            <div class="footer">
              <p>© 2024 Smart Biz360. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Bem-vindo ao Smart Biz360!

Olá ${data.userName},

Sua empresa ${data.companyName} foi cadastrada com sucesso no Smart Biz360!

Você tem 14 dias de trial gratuito para explorar todas as funcionalidades.

${data.credentials ? `
Suas credenciais de acesso:
Usuário: ${data.credentials.username}
Senha: ${data.credentials.password}
` : ''}

Acesse: ${data.loginUrl}

Atenciosamente,
Equipe Smart Biz360
      `
    };
  }

  /**
   * Template: Trial expirando
   */
  getTrialExpiringTemplate(data: { 
    companyName: string; 
    userName: string; 
    daysRemaining: number;
    upgradeUrl: string;
  }): EmailTemplate {
    return {
      subject: `Seu trial expira em ${data.daysRemaining} dias - Smart Biz360`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .highlight { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Seu Trial Está Acabando</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.userName}</strong>,</p>
              
              <div class="highlight">
                <p>Seu período de trial no Smart Biz360 expira em <strong>${data.daysRemaining} dias</strong>.</p>
              </div>
              
              <p>Para continuar aproveitando todas as funcionalidades, faça upgrade para um plano pago:</p>
              
              <ul>
                <li>✅ Mantenha todos os seus dados</li>
                <li>✅ Continue usando as integrações</li>
                <li>✅ Acesso a suporte prioritário</li>
                <li>✅ Novos recursos exclusivos</li>
              </ul>
              
              <p style="text-align: center;">
                <a href="${data.upgradeUrl}" class="button">Fazer Upgrade Agora</a>
              </p>
              
              <p>Atenciosamente,<br>Equipe Smart Biz360</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Seu Trial Está Acabando

Olá ${data.userName},

Seu período de trial no Smart Biz360 expira em ${data.daysRemaining} dias.

Para continuar aproveitando todas as funcionalidades, faça upgrade para um plano pago.

Acesse: ${data.upgradeUrl}

Atenciosamente,
Equipe Smart Biz360
      `
    };
  }

  /**
   * Template: Pagamento confirmado
   */
  getPaymentConfirmedTemplate(data: { 
    companyName: string; 
    userName: string; 
    planName: string;
    amount: number;
    invoiceUrl: string;
  }): EmailTemplate {
    return {
      subject: `Pagamento confirmado - Smart Biz360`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .receipt { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Pagamento Confirmado</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.userName}</strong>,</p>
              
              <p>Seu pagamento foi processado com sucesso!</p>
              
              <div class="receipt">
                <p><strong>Detalhes:</strong></p>
                <p>Empresa: ${data.companyName}</p>
                <p>Plano: ${data.planName}</p>
                <p>Valor: R$ ${data.amount.toFixed(2)}</p>
              </div>
              
              <p style="text-align: center;">
                <a href="${data.invoiceUrl}" class="button">Ver Fatura</a>
              </p>
              
              <p>Obrigado por confiar no Smart Biz360!</p>
              
              <p>Atenciosamente,<br>Equipe Smart Biz360</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Pagamento Confirmado

Olá ${data.userName},

Seu pagamento foi processado com sucesso!

Detalhes:
- Empresa: ${data.companyName}
- Plano: ${data.planName}
- Valor: R$ ${data.amount.toFixed(2)}

Ver fatura: ${data.invoiceUrl}

Obrigado por confiar no Smart Biz360!

Atenciosamente,
Equipe Smart Biz360
      `
    };
  }

  /**
   * Template: Falha no pagamento
   */
  getPaymentFailedTemplate(data: { 
    companyName: string; 
    userName: string; 
    updatePaymentUrl: string;
  }): EmailTemplate {
    return {
      subject: `⚠️ Problema com seu pagamento - Smart Biz360`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef2f2; border: 1px solid #ef4444; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Problema com Pagamento</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${data.userName}</strong>,</p>
              
              <div class="warning">
                <p>Não conseguimos processar o pagamento da sua assinatura.</p>
              </div>
              
              <p>Por favor, atualize suas informações de pagamento para evitar a suspensão do serviço.</p>
              
              <p style="text-align: center;">
                <a href="${data.updatePaymentUrl}" class="button">Atualizar Pagamento</a>
              </p>
              
              <p>Se precisar de ajuda, entre em contato com nosso suporte.</p>
              
              <p>Atenciosamente,<br>Equipe Smart Biz360</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Problema com Pagamento

Olá ${data.userName},

Não conseguimos processar o pagamento da sua assinatura.

Por favor, atualize suas informações de pagamento para evitar a suspensão do serviço.

Acesse: ${data.updatePaymentUrl}

Atenciosamente,
Equipe Smart Biz360
      `
    };
  }

  /**
   * Enviar email de boas-vindas
   */
  async sendWelcome(email: string, data: Parameters<typeof this.getWelcomeTemplate>[0]): Promise<boolean> {
    const template = this.getWelcomeTemplate(data);
    return this.send({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Enviar email de trial expirando
   */
  async sendTrialExpiring(email: string, data: Parameters<typeof this.getTrialExpiringTemplate>[0]): Promise<boolean> {
    const template = this.getTrialExpiringTemplate(data);
    return this.send({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Enviar email de pagamento confirmado
   */
  async sendPaymentConfirmed(email: string, data: Parameters<typeof this.getPaymentConfirmedTemplate>[0]): Promise<boolean> {
    const template = this.getPaymentConfirmedTemplate(data);
    return this.send({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Enviar email de falha no pagamento
   */
  async sendPaymentFailed(email: string, data: Parameters<typeof this.getPaymentFailedTemplate>[0]): Promise<boolean> {
    const template = this.getPaymentFailedTemplate(data);
    return this.send({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }
}

export default new EmailService();
