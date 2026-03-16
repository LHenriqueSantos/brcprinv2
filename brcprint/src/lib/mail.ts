import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // Use SSL for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getLocales = (lang: string) => {
  const dicts: any = {
    pt: {
      subject: "Sua cotação está pronta",
      greeting: "Olá",
      goodNews: "Temos boas notícias: a sua cotação",
      processed: "já foi processada pelo nosso sistema.",
      viewDetails: "Você pode visualizar todos os detalhes, breakdown de custos e aprovar a cotação diretamente pelo nosso portal do cliente:",
      cta: "Acessar Minha Cotação",
      tip: "Dica: No portal você também pode solicitar contrapropostas ou baixar a cotação em PDF.",
      automatic: "Este é um e-mail automático enviado pelo sistema brcprint. Por favor, não responda diretamente a este e-mail."
    },
    en: {
      subject: "Your quote is ready",
      greeting: "Hello",
      goodNews: "We have good news: your quote",
      processed: "has been processed by our system.",
      viewDetails: "You can view all details, cost breakdown, and approve the quote directly through our customer portal:",
      cta: "Access My Quote",
      tip: "Tip: In the portal you can also request counter-offers or download the quote in PDF.",
      automatic: "This is an automatic email sent by the brcprint system. Please do not reply directly to this email."
    },
    es: {
      subject: "Su presupuesto está listo",
      greeting: "Hola",
      goodNews: "Tenemos buenas noticias: su presupuesto",
      processed: "ha sido procesado por nuestro sistema.",
      viewDetails: "Puede ver todos los detalles, el desglose de costos y aprobar el presupuesto directamente a través de nuestro portal del cliente:",
      cta: "Acceder a Mi Presupuesto",
      tip: "Consejo: En el portal también puede solicitar contraofertas o descargar el presupuesto en PDF.",
      automatic: "Este es un correo electrónico automático enviado por el sistema brcprint. Por favor, no responda directamente a este correo."
    }
  };
  return dicts[lang] || dicts.pt;
};

const getRecoveryLocales = (lang: string) => {
  const dicts: any = {
    pt: {
      subject: "Seu projeto 3D aguarda você!",
      greeting: "Olá",
      question: "Percebemos que sua cotação ainda está aguardando sua aprovação.",
      discount: "Que tal fechar hoje? Acesse a cotação no link abaixo para finalizar seu pedido.",
      cta: "Acessar e Finalizar",
    },
    en: {
      subject: "Your 3D project is waiting!",
      greeting: "Hello",
      question: "We noticed your quote is still waiting for your approval.",
      discount: "How about closing it today? Access the quote at the link below to finalize your order.",
      cta: "Access and Finalize",
    },
    es: {
      subject: "¡Tu proyecto 3D te espera!",
      greeting: "Hola",
      question: "Notamos que su presupuesto aún espera su aprobación.",
      discount: "¿Qué te parece cerrarlo hoy? Acceda a la cotización en el enlace a continuación para finalizar su pedido.",
      cta: "Acceder y Finalizar",
    }
  };
  return dicts[lang] || dicts.pt;
};

export async function sendQuoteEmail({
  to,
  clientName,
  quoteTitle,
  portalUrl,
  lang = "pt",
}: {
  to: string;
  clientName: string;
  quoteTitle: string;
  portalUrl: string;
  lang?: string;
}) {
  const L = getLocales(lang);
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `${L.subject}: ${quoteTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6c63ff;">${L.greeting}, ${clientName}!</h2>
        <p>${L.goodNews} <strong>"${quoteTitle}"</strong> ${L.processed}</p>
        <p>${L.viewDetails}</p>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${portalUrl}" style="background-color: #6c63ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            ${L.cta}
          </a>
        </div>

        <p style="color: #64748b; font-size: 0.875rem;">
          ${L.tip}
        </p>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

        <p style="font-size: 0.75rem; color: #94a3b8; text-align: center;">
          ${L.automatic}
        </p>
      </div>
    `,
  });

  return info;
}

export async function sendRecoveryEmail({
  to,
  clientName,
  portalUrl,
  lang = "pt",
}: {
  to: string;
  clientName: string;
  portalUrl: string;
  lang?: string;
}) {
  const L = getRecoveryLocales(lang);
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: L.subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6c63ff;">${L.greeting}, ${clientName}!</h2>
        <p>${L.question}</p>
        <p>${L.discount}</p>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${portalUrl}" style="background-color: #6c63ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            ${L.cta}
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

        <p style="font-size: 0.75rem; color: #94a3b8; text-align: center;">
          Este é um e-mail automático enviado pelo sistema brcprint.
        </p>
      </div>
    `,
  });

  return info;
}
