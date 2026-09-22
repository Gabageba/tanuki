import { Inject, Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type { Language } from '@tanuki/contracts';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { resetPasswordContent, verifyEmailContent } from './templates';

/**
 * Без SMTP_HOST в env письмо не отправляется, а ссылка пишется в лог — этого достаточно для
 * локальной разработки без поднятого Mailpit. При настроенном SMTP_HOST транспорт один на всё
 * приложение: пересоздавать соединение на каждое письмо незачем.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: Transporter | null;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.transport = env.SMTP_HOST
      ? createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
          // Дефолты nodemailer — минуты. Register/forgot-password не должны виснуть на упавшем
          // SMTP: AuthService и так переживает ошибку отправки, но не должен её ждать долго.
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 10_000,
        })
      : null;
  }

  async sendVerifyEmail(to: string, language: Language, url: string): Promise<void> {
    await this.send(to, verifyEmailContent(language, url));
  }

  async sendResetPassword(to: string, language: Language, url: string): Promise<void> {
    await this.send(to, resetPasswordContent(language, url));
  }

  private async send(to: string, content: { subject: string; text: string; html: string }) {
    if (!this.transport) {
      this.logger.log(`SMTP не настроен — письмо «${content.subject}» для ${to}:\n${content.text}`);
      return;
    }

    await this.transport.sendMail({
      from: this.env.MAIL_FROM,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  }
}
