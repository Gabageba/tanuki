import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { apiFetch, ApiRequestError } from '@/shared/api/client';
import type { Language } from '@/shared/lib/language';

/** Зеркалит RESEND_VERIFICATION_COOLDOWN_S из apps/api/src/auth/models.ts — только для того,
 *  чтобы кнопка сразу показывала обратный отсчёт, не дожидаясь первого 429 от сервера. */
const RESEND_COOLDOWN_S = 60;

type Props = {
  email: string;
  /** Своя отправка вместо письма подтверждения регистрации — например, кода смены почты. */
  onResend?: () => Promise<unknown>;
};

/** Кнопка повторной отправки письма — общая для Login (баннер о неподтверждённой почте),
 *  Register (экран «Проверьте почту») и смены почты в профиле. Сама считает кулдаун, включая
 *  случай 429. */
function ResendVerificationButton({ email, onResend }: Props) {
  const { t, i18n } = useTranslation();
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!cooldownEndsAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [cooldownEndsAt]);

  const mutation = useMutation({
    mutationFn: () =>
      onResend?.() ??
      apiFetch('/auth/resend-verification', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, language: i18n.language as Language }),
      }),
    onSuccess: () => setCooldownEndsAt(Date.now() + RESEND_COOLDOWN_S * 1000),
    onError: (error) => {
      // Сервер тоже лимитирует эту ручку — синхронизируем кулдаун с его retryAfter, а не молчим.
      if (error instanceof ApiRequestError && error.code === API_ERROR_CODE.TOO_MANY_REQUESTS) {
        setCooldownEndsAt(Date.now() + RESEND_COOLDOWN_S * 1000);
      }
    },
  });

  const secondsLeft = cooldownEndsAt ? Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000)) : 0;

  return (
    <Button
      variant="default"
      size="sm"
      leftSection={<ArrowClockwiseIcon />}
      loading={mutation.isPending}
      disabled={secondsLeft > 0}
      onClick={() => mutation.mutate()}
    >
      {secondsLeft > 0 ? t('sendAgainIn', { count: secondsLeft }) : t('sendAgain')}
    </Button>
  );
}

export default ResendVerificationButton;
