import { describe, expect, it } from 'vitest';
import { LANGUAGE } from '@tanuki/contracts';
import { resolveLanguage, translateErrorMessage } from './error-messages';
import { NotFoundApiException, ParserFailedException } from './errors';

describe('error-messages', () => {
  it('translates a key into the requested language', () => {
    expect(translateErrorMessage(LANGUAGE.RU, 'notFound')).toBe('Не найдено');
    expect(translateErrorMessage(LANGUAGE.EN, 'notFound')).toBe('Not found');
  });

  it('interpolates params and leaves unknown placeholders intact', () => {
    expect(translateErrorMessage(LANGUAGE.EN, 'sourceNotFound', { sourceId: 'remanga' })).toBe(
      'Source remanga not found',
    );
    expect(translateErrorMessage(LANGUAGE.EN, 'sourceNotFound')).toBe(
      'Source {{sourceId}} not found',
    );
  });

  it('formats a date param for the requested language', () => {
    const date = new Date('2026-10-12T00:00:00Z');
    expect(translateErrorMessage(LANGUAGE.RU, 'accountBlockedUntilDate', { date })).toBe(
      'Аккаунт заблокирован до 12\u00a0октября\u00a02026\u00a0г.',
    );
    expect(translateErrorMessage(LANGUAGE.EN, 'accountBlockedUntilDate', { date })).toBe(
      'The account is blocked until October\u00a012,\u00a02026',
    );
  });

  it('resolves the language from Accept-Language, falling back to Russian', () => {
    expect(resolveLanguage('en')).toBe(LANGUAGE.EN);
    expect(resolveLanguage('en-US,en;q=0.9,ru;q=0.8')).toBe(LANGUAGE.EN);
    expect(resolveLanguage('RU')).toBe(LANGUAGE.RU);
    expect(resolveLanguage('de-DE')).toBe(LANGUAGE.RU);
    expect(resolveLanguage(undefined)).toBe(LANGUAGE.RU);
  });

  it('keeps the Russian text or the raw detail as the internal exception message', () => {
    expect(new NotFoundApiException('chapterNotFound').message).toBe('Глава не найдена');
    expect(new ParserFailedException('remanga', 'unexpected token').message).toBe(
      'unexpected token',
    );
  });
});
