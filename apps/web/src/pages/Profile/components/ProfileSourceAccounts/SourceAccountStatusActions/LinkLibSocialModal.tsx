import { useCallback, useMemo, useRef, useState } from 'react';
import { Tabs, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { KeyIcon, PasswordIcon, SignInIcon } from '@phosphor-icons/react';
import { SOURCE_AUTH_FAMILY, type LibSocialLoginStep, type Source } from '@tanuki/contracts';
import useLinkLibSocialAccount from '../hooks/useLinkLibSocialAccount';
import { getSourceAuthFamilyTitle } from '@/entities/source-account/lib';
import PasswordAccountForm from './PasswordAccountForm';
import LibSocialTokenForm from './LibSocialTokenForm';
import LibSocialCodeStep from './LibSocialCodeStep';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  /** Сайты сети, в которые можно войти. */
  sources: Source[];
  /** Сайт, который предлагается во вкладке токена первым, — тот, где входа ещё нет. */
  defaultTokenSourceId: string | undefined;
  opened: boolean;
  onClose: () => void;
};

const LOGIN_TAB = {
  PASSWORD: 'password',
  TOKEN: 'token',
} as const;

/**
 * LibSocial: основной путь — логин и пароль, с ними сервер сам проходит форму входа на каждом
 * сайте сети, а сайт, приславший код на почту, ждёт его на внутреннем шаге. Запасной — перенос
 * токена из localStorage сайта, для входящих туда через VK или Яндекс: токен подходит только
 * своему сайту, поэтому переносится для каждого отдельно.
 */
function LinkLibSocialModal({ sources, defaultTokenSourceId, opened, onClose }: Props) {
  const { t } = useTranslation();
  const linkAccount = useLinkLibSocialAccount();
  /** Сайт, ждущий код из письма; null — шаг логина и пароля. */
  const [pendingSourceId, setPendingSourceId] = useState<string | null>(null);

  const operationId = useRef(0);

  const handleBack = () => {
    operationId.current += 1;
    setPendingSourceId(null);
  };

  const handleClose = useCallback(() => {
    operationId.current += 1;
    setPendingSourceId(null);
    onClose();
  }, [onClose]);

  const handleStep = useCallback(
    async (operation: () => Promise<LibSocialLoginStep>) => {
      const id = ++operationId.current;
      try {
        const step = await operation();
        if (operationId.current !== id) return;
        if (step.pendingSourceId) setPendingSourceId(step.pendingSourceId);
        else handleClose();
      } catch (error) {
        if (operationId.current === id) throw error;
      }
    },
    [handleClose],
  );

  const pendingSite = pendingSourceId
    ? (sources.find((source) => source.id === pendingSourceId)?.title ?? pendingSourceId)
    : null;

  const TABS = useMemo(
    () => [
      {
        id: LOGIN_TAB.PASSWORD,
        icon: <PasswordIcon />,
        title: t('loginAndPassword'),
        content: (
          <PasswordAccountForm
            isPending={linkAccount.isPending}
            onSubmit={(values) => handleStep(() => linkAccount.mutateAsync(values))}
            onCancel={handleClose}
            meta={
              <Text fz={12} c="dimmed">
                {t('logInViaVkOrYandexSetPasswordOrUseToken')}
              </Text>
            }
          />
        ),
      },
      {
        id: LOGIN_TAB.TOKEN,
        icon: <KeyIcon />,
        title: t('token'),
        content: (
          <LibSocialTokenForm
            sources={sources}
            defaultSourceId={defaultTokenSourceId}
            onClose={handleClose}
          />
        ),
      },
    ],
    [defaultTokenSourceId, handleClose, handleStep, linkAccount, sources, t],
  );

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={SignInIcon}
      opened={opened}
      onClose={handleClose}
      title={
        pendingSite
          ? t('enterCode')
          : t('logInToName', { name: getSourceAuthFamilyTitle(SOURCE_AUTH_FAMILY.LIBSOCIAL) })
      }
      // Назад — к логину и паролю: вход начнётся заново, начатый на сервере отбросится.
      onBack={pendingSite ? handleBack : undefined}
      size="lg"
    >
      {pendingSite ? (
        <LibSocialCodeStep key={pendingSourceId} site={pendingSite} onStep={handleStep} />
      ) : (
        <Tabs defaultValue={LOGIN_TAB.PASSWORD} keepMounted={false}>
          <Tabs.List>
            {TABS.map(({ id, title, icon }) => (
              <Tabs.Tab key={id} value={id} leftSection={icon}>
                {title}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {TABS.map(({ id, content }) => (
            <Tabs.Panel value={id} key={id} mt="md">
              {content}
            </Tabs.Panel>
          ))}
        </Tabs>
      )}
    </ToneModal>
  );
}

export default LinkLibSocialModal;
