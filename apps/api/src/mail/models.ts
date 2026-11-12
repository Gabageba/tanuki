import type { SendMailOptions } from 'nodemailer';
import type { EnumLiteralsOf } from '@tanuki/contracts';

export const EMAIL_IMAGE = {
  LOGO: 'logo',
  CONFIRM: 'confirm',
  PASSWORD: 'password',
  RESTORE: 'restore',
} as const;
export type EmailImage = EnumLiteralsOf<typeof EMAIL_IMAGE>;

export type EmailContent = {
  subject: string;
  text: string;
  html: string;
  attachments: NonNullable<SendMailOptions['attachments']>;
};

export type EmailMessage = {
  subject: string;
  preheader: string;
  title: string;
  paragraphs: string[];
  detail?: { label: string; value: string; monospace?: boolean };
  code?: string;
  action?: { label: string; url: string; icon: EmailImage };
  expiry?: string;
  explanation: string;
};

// Самостоятельный почтовый HTML не наследует Mantine CSS-переменные. Значения соответствуют
// shared/lib/palette.ts и app/Providers/models.ts web-приложения (решение E1b).
export const EMAIL_COLORS = {
  BACKGROUND: '#f6f7f9',
  SURFACE: '#ffffff',
  SUBTLE: '#f1f3f6',
  TEXT: '#16191d',
  SECONDARY: '#4b525b',
  BORDER: '#dfe3e8',
  ACCENT: '#ef8168',
  ACTION_TEXT: '#000000',
  LINK: '#ae4f3a',
  DARK_BACKGROUND: '#101215',
  DARK_SURFACE: '#16191d',
  DARK_SUBTLE: '#1c2026',
  DARK_TEXT: '#e7eaee',
  DARK_SECONDARY: '#9aa3ad',
  DARK_BORDER: '#262b32',
  DARK_LINK: '#fa9a84',
} as const;
