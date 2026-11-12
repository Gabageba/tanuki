import { readFileSync } from 'node:fs';
import { createTransport } from 'nodemailer';
import { describe, expect, it } from 'vitest';
import { LANGUAGE, type Language } from '@tanuki/contracts';
import {
  accountDeletionScheduledContent,
  emailChangeCodeContent,
  emailChangedContent,
  resetPasswordContent,
  verifyEmailContent,
} from './templates';

const APP_URL = 'https://reader.example/tanuki/';
const URL = `${APP_URL}verify-email?token=${'abcdef0123456789'.repeat(4)}&next=library`;
const EMAIL = 'a***@example.com';
const CODE = '047281';
const DATE_RU = '26 ноября 2026 г.';
const DATE_EN = 'November 26, 2026';

const getLocalizedValues = (language: Language) => {
  switch (language) {
    case LANGUAGE.RU:
      return {
        date: DATE_RU,
        expected: ['24 часа', '1 час', '15 минут', '7 дней', '26\u00a0ноября\u00a02026\u00a0г.'],
        fallbackLink: 'откройте ссылку в браузере',
      };
    case LANGUAGE.EN:
      return {
        date: DATE_EN,
        expected: ['24 hours', '1 hour', '15 minutes', '7 days', DATE_EN],
        fallbackLink: 'open the link in your browser',
      };
  }
};

const getEmails = (language: Language) => [
  verifyEmailContent(language, URL, APP_URL),
  resetPasswordContent(language, URL, APP_URL),
  emailChangeCodeContent(language, CODE, APP_URL),
  emailChangedContent(language, EMAIL, URL, APP_URL),
  accountDeletionScheduledContent(language, getLocalizedValues(language).date, URL, APP_URL),
];

describe.each(Object.values(LANGUAGE))('системные письма: %s', (language) => {
  it('локализует все пять сценариев, сохраняет код и сроки в HTML и plain text', () => {
    const emails = getEmails(language);
    const { expected } = getLocalizedValues(language);

    emails.forEach((email, index) => {
      expect(email.subject.length).toBeGreaterThan(10);
      expect(email.html).toContain(`<html lang="${language}">`);
      expect(email.html).toContain(expected[index]);
      expect(email.text).toContain(expected[index]);
      expect(email.html).toContain('content="light dark"');
      expect(email.html).toContain('@media (prefers-color-scheme:dark)');
      expect(email.html).toContain(`${APP_URL}mail/fonts/`);
      expect(email.html).toContain('Arial,sans-serif');
      expect(email.html).not.toContain('tanuki.example');
      expect(email.html).not.toContain('pages/Playground');
    });

    const codeEmail = emails[2]!;
    expect(codeEmail.subject).toContain(CODE);
    expect(codeEmail.html).toContain(`>${CODE}</p>`);
    expect(codeEmail.text.split('\n\n')).toContain(CODE);
    expect(codeEmail.html).not.toContain('<a ');
    expect(emails[3]!.text).toContain(EMAIL);
    expect(emails[4]!.subject).toContain(expected[4]);
    expect(emails[4]!.html).not.toContain('г..');
  });

  it('сохраняет полный URL в plain text, а в HTML — только в двух одинаковых href', () => {
    for (const email of getEmails(language)) {
      if (!email.html.includes('<a ')) continue;
      expect(email.text).toContain(URL);
      const hrefs = [...email.html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
      expect(hrefs).toEqual([URL.replaceAll('&', '&amp;'), URL.replaceAll('&', '&amp;')]);
      const visibleText = email.html.replace(/<[^>]*>/g, '');
      expect(visibleText).not.toContain('abcdef0123456789');
      expect(visibleText).toContain(getLocalizedValues(language).fallbackLink);
    }
  });

  it('вкладывает существующие PNG ровно для всех cid-изображений', () => {
    for (const email of getEmails(language)) {
      const cids = [...email.html.matchAll(/src="cid:([^"]+)"/g)].map((match) => match[1]);
      expect(email.attachments.map(({ cid }) => cid).sort()).toEqual(cids.sort());
      for (const attachment of email.attachments) {
        expect(attachment.contentType).toBe('image/png');
        expect(attachment.contentDisposition).toBe('inline');
        expect(typeof attachment.path).toBe('string');
        const data = readFileSync(attachment.path as string);
        expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      }
    }
  });
});

describe('экранирование HTML', () => {
  it('не превращает адрес, код, дату и параметры ссылки в разметку', () => {
    const value = '<img src=x onerror="alert(1)">&\'';
    const url = `https://reader.example/?token=" onmouseover="bad&value='<>`;
    const emails = [
      verifyEmailContent(LANGUAGE.RU, url, APP_URL),
      emailChangeCodeContent(LANGUAGE.EN, value, APP_URL),
      emailChangedContent(LANGUAGE.RU, value, url, APP_URL),
      accountDeletionScheduledContent(LANGUAGE.EN, value, url, APP_URL),
    ];
    for (const email of emails) {
      expect(email.html).not.toContain('<img src=x');
      expect(email.html).not.toContain('token=" onmouseover=');
      expect(email.html).not.toContain("value='<>");
      expect(email.html).toContain('&quot;');
    }
    expect(emails[1]!.text).toContain(value);
    expect(emails[2]!.text).toContain(value);
  });
});

describe('MIME письма', () => {
  it('nodemailer собирает альтернативные версии и встроенные PNG без SMTP', async () => {
    const transport = createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
    for (const email of getEmails(LANGUAGE.RU)) {
      const result = await transport.sendMail({
        from: 'Tanuki <noreply@example.com>',
        to: 'reader@example.com',
        ...email,
      });
      const message = result.message.toString();
      expect(message).toContain('Content-Type: multipart/alternative;');
      expect(message).toContain('Content-Type: multipart/related;');
      expect(message).toContain('Content-Type: text/plain; charset=utf-8');
      expect(message).toContain('Content-Type: text/html; charset=utf-8');
      for (const attachment of email.attachments) {
        expect(message).toContain(`Content-ID: <${attachment.cid}>`);
        expect(message).toContain(`Content-Disposition: inline; filename=${attachment.filename}`);
      }
    }
  });
});
