import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGE } from '@tanuki/contracts';
import type { Env } from '../config/env';
import { MailService } from './mail.service';

const { SEND_MAIL, CREATE_TRANSPORT } = vi.hoisted(() => {
  const SEND_MAIL = vi.fn().mockResolvedValue({});
  return { SEND_MAIL, CREATE_TRANSPORT: vi.fn(() => ({ sendMail: SEND_MAIL })) };
});

vi.mock('nodemailer', () => ({ createTransport: CREATE_TRANSPORT }));

const ENV = {
  APP_URL: 'https://reader.example',
  MAIL_FROM: 'Tanuki <noreply@example.com>',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
} as Env;
const TO = 'reader@example.com';
const URL = `${ENV.APP_URL}/verify-email?token=abcdef`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MailService', () => {
  it('передаёт ресурсы всех пяти писем в один SMTP-транспорт', async () => {
    const service = new MailService(ENV);
    await service.sendVerifyEmail(TO, LANGUAGE.RU, URL);
    await service.sendResetPassword(TO, LANGUAGE.EN, URL);
    await service.sendEmailChangeCode(TO, LANGUAGE.RU, '047281');
    await service.sendEmailChanged(TO, LANGUAGE.EN, 'a***@example.com', URL);
    await service.sendAccountDeletionScheduled(TO, LANGUAGE.RU, '26 ноября 2026 г.', URL);

    expect(CREATE_TRANSPORT).toHaveBeenCalledTimes(1);
    expect(SEND_MAIL).toHaveBeenCalledTimes(5);
    for (const [message] of SEND_MAIL.mock.calls) {
      expect(message).toMatchObject({
        from: ENV.MAIL_FROM,
        to: TO,
        html: expect.stringContaining(`${ENV.APP_URL}/mail/fonts/`),
        text: expect.any(String),
        subject: expect.any(String),
        attachments: expect.arrayContaining([expect.objectContaining({ cid: 'logo@tanuki' })]),
      });
    }
  });

  it('без SMTP сохраняет ссылку в лог и не создаёт транспорт', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    try {
      const service = new MailService({ ...ENV, SMTP_HOST: undefined });
      await service.sendVerifyEmail(TO, LANGUAGE.RU, URL);
      expect(CREATE_TRANSPORT).not.toHaveBeenCalled();
      expect(SEND_MAIL).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith(expect.stringContaining(URL));
    } finally {
      log.mockRestore();
    }
  });
});
