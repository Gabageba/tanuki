import { createTransport } from 'nodemailer';

const main = async () => {
  const host = process.env['SMTP_HOST'];
  if (!host) throw new Error('SMTP_HOST обязателен');
  const transport = createTransport({
    host,
    port: Number(process.env['SMTP_PORT'] ?? 587),
    secure: process.env['SMTP_SECURE'] === 'true',
    auth: process.env['SMTP_USER']
      ? { user: process.env['SMTP_USER'], pass: process.env['SMTP_PASSWORD'] }
      : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
  try {
    await transport.verify();
    console.log('Подключение и авторизация SMTP проверены; письмо не отправлялось.');
  } finally {
    transport.close();
  }
};

main().catch(() => {
  console.error(
    'SMTP недоступен или не принял авторизацию. Проверьте SMTP_HOST/PORT/USER/PASSWORD.',
  );
  process.exitCode = 1;
});
