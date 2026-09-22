import type { Language } from '@tanuki/contracts';

type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

const wrapHtml = (title: string, bodyHtml: string): string => `<!doctype html>
<html>
  <body style="font-family: sans-serif; background: #16151a; color: #e7e6ea; padding: 32px;">
    <div style="max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">${title}</h1>
      ${bodyHtml}
    </div>
  </body>
</html>`;

const linkButton = (url: string, label: string): string =>
  `<p><a href="${url}" style="display: inline-block; background: #6c5ce7; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none;">${label}</a></p>
   <p style="color: #9a99a2; font-size: 13px;">${url}</p>`;

export const verifyEmailContent = (language: Language, url: string): EmailContent => {
  switch (language) {
    case 'ru':
      return {
        subject: 'Подтвердите почту в Tanuki',
        text: `Чтобы подтвердить почту, перейдите по ссылке: ${url}\n\nСсылка действует 24 часа.`,
        html: wrapHtml(
          'Подтвердите почту',
          `<p>Перейдите по ссылке, чтобы подтвердить почту и завершить регистрацию.</p>${linkButton(url, 'Подтвердить почту')}<p style="color: #9a99a2; font-size: 13px;">Ссылка действует 24 часа. Если вы не регистрировались в Tanuki — просто проигнорируйте письмо.</p>`,
        ),
      };
    case 'en':
      return {
        subject: 'Confirm your email for Tanuki',
        text: `Confirm your email by following this link: ${url}\n\nThe link is valid for 24 hours.`,
        html: wrapHtml(
          'Confirm your email',
          `<p>Follow the link to confirm your email and finish registration.</p>${linkButton(url, 'Confirm email')}<p style="color: #9a99a2; font-size: 13px;">The link is valid for 24 hours. If you didn't sign up for Tanuki, ignore this email.</p>`,
        ),
      };
  }
};

export const resetPasswordContent = (language: Language, url: string): EmailContent => {
  switch (language) {
    case 'ru':
      return {
        subject: 'Сброс пароля в Tanuki',
        text: `Чтобы сбросить пароль, перейдите по ссылке: ${url}\n\nСсылка действует 1 час.`,
        html: wrapHtml(
          'Сброс пароля',
          `<p>Перейдите по ссылке, чтобы задать новый пароль.</p>${linkButton(url, 'Сбросить пароль')}<p style="color: #9a99a2; font-size: 13px;">Ссылка действует 1 час. Если вы не запрашивали сброс — просто проигнорируйте письмо.</p>`,
        ),
      };
    case 'en':
      return {
        subject: 'Reset your Tanuki password',
        text: `Reset your password by following this link: ${url}\n\nThe link is valid for 1 hour.`,
        html: wrapHtml(
          'Reset your password',
          `<p>Follow the link to set a new password.</p>${linkButton(url, 'Reset password')}<p style="color: #9a99a2; font-size: 13px;">The link is valid for 1 hour. If you didn't request this, ignore this email.</p>`,
        ),
      };
  }
};
