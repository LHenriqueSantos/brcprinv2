import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import pool from '@/lib/db';
import { checkAdmin, forbiddenResponse } from '@/lib/adminCheck';

export async function POST(req: Request) {
  if (!await checkAdmin()) return forbiddenResponse();

  try {
    const bodyText = await req.text();
    let toEmail = null;
    if (bodyText) {
      try {
        const bodyObj = JSON.parse(bodyText);
        toEmail = bodyObj.to;
      } catch (e) { }
    }

    const [rows] = await pool.query('SELECT smtp_host, smtp_port, smtp_user, smtp_pass, sender_email FROM business_config WHERE id = 1');
    const config = (rows as any[])[0];

    if (!config?.smtp_host || !config?.smtp_user || !config?.smtp_pass) {
      return NextResponse.json({ success: false, error: 'Configuração SMTP incompleta no banco de dados.' }, { status: 400 });
    }

    // If sender_email doesn't have an @ (e.g., they just typed "BRCPrint"), fallback strictly to smtp_user
    let validSenderEmail = config.sender_email || config.smtp_user;
    if (!validSenderEmail.includes('@')) {
      validSenderEmail = config.smtp_user;
    }

    if (!toEmail) toEmail = validSenderEmail;

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: Number(config.smtp_port) || 587,
      secure: Number(config.smtp_port) === 465,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `BRCPrint <${validSenderEmail}>`,
      to: toEmail,
      subject: '✅ Servidor BRCPrint: Teste de E-mail Bem-sucedido',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0f172a;">Teste de Conexão SMTP</h2>
          <p>Olá Administrador,</p>
          <p>Se você está lendo este e-mail, significa que as credenciais SMTP configuradas no painel do <strong>BRCPrint</strong> estão funcionando perfeitamente!</p>
          <br/>
          <p><strong>Detalhes Técnicos:</strong></p>
          <ul>
            <li>Host: ${config.smtp_host}</li>
            <li>Porta: ${config.smtp_port}</li>
            <li>Autenticação: ${config.smtp_user}</li>
          </ul>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro de teste SMTP:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
