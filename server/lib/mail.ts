import nodemailer from 'nodemailer';
export async function sendMail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM)
    throw new Error('SMTP_HOST and MAIL_FROM are required');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER
      ? {
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        }
      : {}),
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transport.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
}
