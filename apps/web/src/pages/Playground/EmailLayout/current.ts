import type { Language } from '@tanuki/contracts';

// Снимок apps/api/src/mail/templates.ts от 2026-11-12 для точного E0.
// Старую верстку сохраняем независимо от будущих изменений производственных шаблонов;
// её исходные цвета и размеры намеренно не подгоняются под текущую тему приложения.

type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll(/'/g, '&#39;');

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

const codeBlock = (code: string): string =>
  `<p style="font-family: monospace; font-size: 32px; letter-spacing: 8px; margin: 24px 0;">${code}</p>`;

export const emailChangeCodeContent = (language: Language, code: string): EmailContent => {
  switch (language) {
    case 'ru':
      return {
        subject: `${code} — код для смены почты в Tanuki`,
        text: `Код для смены почты в Tanuki: ${code}\n\nКод действует 15 минут.`,
        html: wrapHtml(
          'Код для смены почты',
          `<p>Введите этот код в Tanuki, чтобы привязать эту почту к аккаунту.</p>${codeBlock(code)}<p style="color: #9a99a2; font-size: 13px;">Код действует 15 минут. Если вы не меняли почту в Tanuki — просто проигнорируйте письмо.</p>`,
        ),
      };
    case 'en':
      return {
        subject: `${code} is your Tanuki email change code`,
        text: `Your Tanuki email change code: ${code}\n\nThe code is valid for 15 minutes.`,
        html: wrapHtml(
          'Email change code',
          `<p>Enter this code in Tanuki to use this email for your account.</p>${codeBlock(code)}<p style="color: #9a99a2; font-size: 13px;">The code is valid for 15 minutes. If you didn't change your email in Tanuki, ignore this email.</p>`,
        ),
      };
  }
};

/** Письмо на прежний адрес после смены: newEmail уже замаскирован вызывающим кодом. */
export const emailChangedContent = (
  language: Language,
  newEmail: string,
  url: string,
): EmailContent => {
  const email = escapeHtml(newEmail);
  switch (language) {
    case 'ru':
      return {
        subject: 'Почта в Tanuki изменена',
        text: `Почта аккаунта Tanuki изменена на ${newEmail}. Если это были не вы, верните прежнюю по ссылке: ${url}\n\nСсылка действует 7 дней.`,
        html: wrapHtml(
          'Почта изменена',
          `<p>Почта вашего аккаунта Tanuki изменена на <b>${email}</b>.</p><p>Если это были вы — ничего делать не нужно. Если нет — верните прежнюю почту: все устройства при этом выйдут из аккаунта.</p>${linkButton(url, 'Это был не я')}<p style="color: #9a99a2; font-size: 13px;">Ссылка действует 7 дней.</p>`,
        ),
      };
    case 'en':
      return {
        subject: 'Your Tanuki email was changed',
        text: `Your Tanuki account email was changed to ${newEmail}. If it wasn't you, restore the previous one here: ${url}\n\nThe link is valid for 7 days.`,
        html: wrapHtml(
          'Email changed',
          `<p>Your Tanuki account email was changed to <b>${email}</b>.</p><p>If it was you, there's nothing to do. If not, restore your previous email: every device gets signed out.</p>${linkButton(url, 'It wasn\u0027t me')}<p style="color: #9a99a2; font-size: 13px;">The link is valid for 7 days.</p>`,
        ),
      };
  }
};

/** date — уже отформатированная дата удаления. */
export const accountDeletionScheduledContent = (
  language: Language,
  date: string,
  url: string,
): EmailContent => {
  switch (language) {
    case 'ru':
      return {
        subject: 'Аккаунт Tanuki будет удалён',
        text: `Аккаунт Tanuki будет удалён ${date} вместе со всеми данными. Чтобы отменить удаление, перейдите по ссылке: ${url}`,
        html: wrapHtml(
          'Аккаунт будет удалён',
          `<p>Аккаунт Tanuki будет удалён <b>${escapeHtml(date)}</b> вместе с прогрессом, историей и настройками.</p><p>До этого удаление можно отменить — по ссылке ниже или просто войдя в аккаунт.</p>${linkButton(url, 'Отменить удаление')}`,
        ),
      };
    case 'en':
      return {
        subject: 'Your Tanuki account will be deleted',
        text: `Your Tanuki account will be deleted on ${date} along with all its data. To cancel, follow this link: ${url}`,
        html: wrapHtml(
          'Your account will be deleted',
          `<p>Your Tanuki account will be deleted on <b>${escapeHtml(date)}</b> along with your progress, history and settings.</p><p>Until then you can cancel — via the link below or just by signing in.</p>${linkButton(url, 'Cancel deletion')}`,
        ),
      };
  }
};
