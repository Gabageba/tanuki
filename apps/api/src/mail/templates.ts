import { LANGUAGE, type Language } from '@tanuki/contracts';
import { buildEmailContent } from './layout';
import { EMAIL_IMAGE, type EmailContent } from './models';

export const verifyEmailContent = (
  language: Language,
  url: string,
  appUrl: string,
): EmailContent => {
  switch (language) {
    case LANGUAGE.RU:
      return buildEmailContent(
        language,
        {
          subject: 'Подтвердите почту в Tanuki',
          preheader: 'Остался один шаг, чтобы завершить регистрацию. Ссылка действует 24 часа.',
          title: 'Подтвердите почту',
          paragraphs: ['Подтвердите этот адрес, чтобы завершить регистрацию и войти в Tanuki.'],
          action: { label: 'Подтвердить почту', url, icon: EMAIL_IMAGE.CONFIRM },
          expiry: 'Ссылка действует 24 часа.',
          explanation: 'Если вы не регистрировались в Tanuki, просто проигнорируйте это письмо.',
        },
        appUrl,
      );
    case LANGUAGE.EN:
      return buildEmailContent(
        language,
        {
          subject: 'Confirm your email for Tanuki',
          preheader: 'One more step to finish signing up. The link is valid for 24 hours.',
          title: 'Confirm your email',
          paragraphs: ['Confirm this email address to finish signing up and sign in to Tanuki.'],
          action: { label: 'Confirm email', url, icon: EMAIL_IMAGE.CONFIRM },
          expiry: 'The link is valid for 24 hours.',
          explanation: "If you didn't sign up for Tanuki, just ignore this email.",
        },
        appUrl,
      );
  }
};

export const resetPasswordContent = (
  language: Language,
  url: string,
  appUrl: string,
): EmailContent => {
  switch (language) {
    case LANGUAGE.RU:
      return buildEmailContent(
        language,
        {
          subject: 'Сброс пароля в Tanuki',
          preheader: 'Задайте новый пароль по ссылке. Она действует 1 час.',
          title: 'Задайте новый пароль',
          paragraphs: [
            'Мы получили запрос на сброс пароля вашего аккаунта. Перейдите по ссылке, чтобы задать новый.',
          ],
          action: { label: 'Задать новый пароль', url, icon: EMAIL_IMAGE.PASSWORD },
          expiry: 'Ссылка действует 1 час.',
          explanation:
            'Если вы не запрашивали сброс, проигнорируйте это письмо. Ваш пароль останется прежним.',
        },
        appUrl,
      );
    case LANGUAGE.EN:
      return buildEmailContent(
        language,
        {
          subject: 'Reset your Tanuki password',
          preheader: 'Set a new password using the link. It is valid for 1 hour.',
          title: 'Set a new password',
          paragraphs: [
            'We received a request to reset your account password. Follow the link to set a new one.',
          ],
          action: { label: 'Set a new password', url, icon: EMAIL_IMAGE.PASSWORD },
          expiry: 'The link is valid for 1 hour.',
          explanation:
            "If you didn't request a reset, ignore this email. Your password will stay the same.",
        },
        appUrl,
      );
  }
};

export const emailChangeCodeContent = (
  language: Language,
  code: string,
  appUrl: string,
): EmailContent => {
  switch (language) {
    case LANGUAGE.RU:
      return buildEmailContent(
        language,
        {
          subject: `${code} — код для смены почты в Tanuki`,
          preheader: 'Введите код в Tanuki, чтобы подтвердить новый адрес. Код действует 15 минут.',
          title: 'Подтвердите новую почту',
          paragraphs: ['Введите этот код в Tanuki, чтобы привязать новый адрес к вашему аккаунту.'],
          code,
          expiry: 'Код действует 15 минут.',
          explanation:
            'Никому не сообщайте этот код. Если вы не меняли почту в Tanuki, проигнорируйте письмо.',
        },
        appUrl,
      );
    case LANGUAGE.EN:
      return buildEmailContent(
        language,
        {
          subject: `${code} is your Tanuki email change code`,
          preheader:
            'Enter the code in Tanuki to confirm your new email. The code is valid for 15 minutes.',
          title: 'Confirm your new email',
          paragraphs: ['Enter this code in Tanuki to link the new email address to your account.'],
          code,
          expiry: 'The code is valid for 15 minutes.',
          explanation:
            "Don't share this code with anyone. If you didn't change your email in Tanuki, ignore this email.",
        },
        appUrl,
      );
  }
};

/** Письмо на прежний адрес после смены: newEmail уже замаскирован вызывающим кодом. */
export const emailChangedContent = (
  language: Language,
  newEmail: string,
  url: string,
  appUrl: string,
): EmailContent => {
  switch (language) {
    case LANGUAGE.RU:
      return buildEmailContent(
        language,
        {
          subject: 'Почта вашего аккаунта Tanuki изменена',
          preheader: 'Если это были не вы, прежний адрес можно вернуть в течение 7 дней.',
          title: 'Почта аккаунта изменена',
          paragraphs: [
            'К вашему аккаунту Tanuki привязан новый адрес. Если это были вы, ничего делать не нужно.',
          ],
          detail: { label: 'Новый адрес', value: newEmail, monospace: true },
          action: { label: 'Вернуть прежнюю почту', url, icon: EMAIL_IMAGE.RESTORE },
          expiry: 'Ссылка действует 7 дней.',
          explanation:
            'Если вы не меняли почту, верните прежний адрес. После возврата все устройства выйдут из аккаунта.',
        },
        appUrl,
      );
    case LANGUAGE.EN:
      return buildEmailContent(
        language,
        {
          subject: 'Your Tanuki account email was changed',
          preheader: "If it wasn't you, you can restore your previous email within 7 days.",
          title: 'Account email changed',
          paragraphs: [
            "A new email address has been linked to your Tanuki account. If it was you, there's nothing to do.",
          ],
          detail: { label: 'New email address', value: newEmail, monospace: true },
          action: { label: 'Restore previous email', url, icon: EMAIL_IMAGE.RESTORE },
          expiry: 'The link is valid for 7 days.',
          explanation:
            "If you didn't change your email, restore the previous address. All devices will be signed out afterwards.",
        },
        appUrl,
      );
  }
};

/** date — уже отформатированная дата удаления, как и до смены дизайна письма. */
export const accountDeletionScheduledContent = (
  language: Language,
  date: string,
  url: string,
  appUrl: string,
): EmailContent => {
  switch (language) {
    case LANGUAGE.RU: {
      const deletionDate = date.replaceAll(' ', '\u00a0');
      return buildEmailContent(
        language,
        {
          subject: `Удаление аккаунта Tanuki запланировано на ${deletionDate}`,
          preheader: `До ${deletionDate} удаление можно отменить по ссылке или входом в аккаунт.`,
          title: 'Аккаунт будет удалён',
          paragraphs: [
            'Мы получили запрос на удаление вашего аккаунта Tanuki. В указанную дату аккаунт и все его данные будут удалены.',
          ],
          detail: { label: 'Дата удаления', value: deletionDate },
          action: { label: 'Отменить удаление аккаунта', url, icon: EMAIL_IMAGE.RESTORE },
          explanation:
            'До этой даты вы можете отменить удаление кнопкой выше или просто войти в аккаунт. После удаления восстановить данные не получится.',
        },
        appUrl,
      );
    }
    case LANGUAGE.EN:
      return buildEmailContent(
        language,
        {
          subject: `Your Tanuki account is scheduled for deletion on ${date}`,
          preheader: `You can cancel deletion before ${date} using the link or by signing in.`,
          title: 'Your account will be deleted',
          paragraphs: [
            'We received a request to delete your Tanuki account. On the specified date, your account and all its data will be deleted.',
          ],
          detail: { label: 'Deletion date', value: date },
          action: { label: 'Cancel account deletion', url, icon: EMAIL_IMAGE.RESTORE },
          explanation:
            "Until then, you can cancel deletion using the button above or just by signing in to your account. Once deleted, your data can't be recovered.",
        },
        appUrl,
      );
  }
};
