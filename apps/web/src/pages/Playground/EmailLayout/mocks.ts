import {
  accountDeletionScheduledContent,
  emailChangeCodeContent,
  emailChangedContent,
  resetPasswordContent,
  verifyEmailContent,
} from './current';
import { EMAIL_KIND, type EmailSample } from './models';

// Зарезервированный домен: ссылки демонстрационные и не ведут в аккаунт пользователя.
const ORIGIN = 'https://tanuki.example';
const TOKEN = '0123456789abcdef'.repeat(4);
const VERIFY_URL = `${ORIGIN}/verify-email?token=${TOKEN}`;
const RESET_URL = `${ORIGIN}/reset-password?token=${TOKEN}`;
const REVERT_URL = `${ORIGIN}/revert-email-change?token=${TOKEN}`;
const RESTORE_URL = `${ORIGIN}/cancel-account-deletion?token=${TOKEN}`;
const CODE = '047 281';
const MASKED_EMAIL = 'a***@example.com';
const DELETION_DATE = '26 ноября 2026 г.';

export const EMAIL_SAMPLES: EmailSample[] = [
  {
    kind: EMAIL_KIND.VERIFICATION,
    name: 'Подтверждение почты',
    subject: 'Подтвердите почту в Tanuki',
    preheader: 'Остался один шаг, чтобы завершить регистрацию. Ссылка действует 24 часа.',
    title: 'Подтвердите почту',
    paragraphs: ['Подтвердите этот адрес, чтобы завершить регистрацию и войти в Tanuki.'],
    action: { label: 'Подтвердить почту', url: VERIFY_URL },
    expiry: 'Ссылка действует 24 часа.',
    explanation: 'Если вы не регистрировались в Tanuki, просто проигнорируйте это письмо.',
    current: verifyEmailContent('ru', VERIFY_URL),
  },
  {
    kind: EMAIL_KIND.PASSWORD_RESET,
    name: 'Сброс пароля',
    subject: 'Сброс пароля в Tanuki',
    preheader: 'Задайте новый пароль по ссылке. Она действует 1 час.',
    title: 'Задайте новый пароль',
    paragraphs: [
      'Мы получили запрос на сброс пароля вашего аккаунта. Перейдите по ссылке, чтобы задать новый.',
    ],
    action: { label: 'Задать новый пароль', url: RESET_URL },
    expiry: 'Ссылка действует 1 час.',
    explanation:
      'Если вы не запрашивали сброс, проигнорируйте это письмо. Ваш пароль останется прежним.',
    current: resetPasswordContent('ru', RESET_URL),
  },
  {
    kind: EMAIL_KIND.CHANGE_CODE,
    name: 'Код смены почты',
    subject: '047281 — код для смены почты в Tanuki',
    preheader: 'Введите код в Tanuki, чтобы подтвердить новый адрес. Код действует 15 минут.',
    title: 'Подтвердите новую почту',
    paragraphs: ['Введите этот код в Tanuki, чтобы привязать новый адрес к вашему аккаунту.'],
    code: CODE,
    expiry: 'Код действует 15 минут.',
    explanation:
      'Никому не сообщайте этот код. Если вы не меняли почту в Tanuki, проигнорируйте письмо.',
    current: emailChangeCodeContent('ru', CODE.replace(' ', '')),
  },
  {
    kind: EMAIL_KIND.EMAIL_CHANGED,
    name: 'Почта изменена',
    subject: 'Почта вашего аккаунта Tanuki изменена',
    preheader: 'Если это были не вы, прежний адрес можно вернуть в течение 7 дней.',
    title: 'Почта аккаунта изменена',
    paragraphs: [
      'К вашему аккаунту Tanuki привязан новый адрес. Если это были вы, ничего делать не нужно.',
    ],
    detail: { label: 'Новый адрес', value: MASKED_EMAIL },
    action: { label: 'Вернуть прежнюю почту', url: REVERT_URL },
    expiry: 'Ссылка действует 7 дней.',
    explanation:
      'Если вы не меняли почту, верните прежний адрес. После возврата все устройства выйдут из аккаунта.',
    current: emailChangedContent('ru', MASKED_EMAIL, REVERT_URL),
  },
  {
    kind: EMAIL_KIND.DELETION,
    name: 'Удаление аккаунта',
    subject: 'Удаление аккаунта Tanuki запланировано на 26 ноября',
    preheader: 'До 26 ноября 2026 года удаление можно отменить по ссылке или входом в аккаунт.',
    title: 'Аккаунт будет удалён',
    paragraphs: [
      'Мы получили запрос на удаление вашего аккаунта Tanuki. В указанную дату аккаунт и все его данные будут удалены.',
    ],
    detail: { label: 'Дата удаления', value: DELETION_DATE },
    action: { label: 'Отменить удаление аккаунта', url: RESTORE_URL },
    explanation:
      'До этой даты вы можете отменить удаление кнопкой выше или просто войти в аккаунт. После удаления восстановить данные не получится.',
    current: accountDeletionScheduledContent('ru', DELETION_DATE, RESTORE_URL),
  },
];
