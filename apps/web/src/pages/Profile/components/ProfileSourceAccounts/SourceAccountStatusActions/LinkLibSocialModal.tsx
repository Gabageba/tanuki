import { useCallback, useMemo, useRef, useState } from 'react';
import { Tabs, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { KeyIcon, PasswordIcon, SignInIcon } from '@phosphor-icons/react';
import type { LibSocialLoginStep, Source } from '@tanuki/contracts';
import useLinkLibSocialAccount from '../hooks/useLinkLibSocialAccount';
import PasswordAccountForm from './PasswordAccountForm';
import LibSocialTokenForm from './LibSocialTokenForm';
import LibSocialCodeStep from './LibSocialCodeStep';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';

type Props = {
  source: Source;
  opened: boolean;
  onClose: () => void;
};

const LOGIN_TAB = {
  PASSWORD: 'password',
  TOKEN: 'token',
} as const;

/** Общая форма OAuth для независимого входа на выбранный сайт. */
function LinkLibSocialModal({ source, opened, onClose }: Props) {
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

  const pendingSite = pendingSourceId ? source.title : null;

  const TABS = useMemo(
    () => [
      {
        id: LOGIN_TAB.PASSWORD,
        icon: <PasswordIcon />,
        title: t('loginAndPassword'),
        content: (
          <PasswordAccountForm
            isPending={linkAccount.isPending}
            onSubmit={(values) =>
              handleStep(() => linkAccount.mutateAsync({ ...values, sourceId: source.id }))
            }
            onCancel={handleClose}
            meta={
              <Text fz={13} c="dimmed">
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
        content: <LibSocialTokenForm source={source} onClose={handleClose} />,
      },
    ],
    [handleClose, handleStep, linkAccount, source, t],
  );

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={SignInIcon}
      opened={opened}
      onClose={handleClose}
      title={pendingSite ? t('enterCode') : t('logInToName', { name: source.title })}
      // Назад — к логину и паролю: вход начнётся заново, начатый на сервере отбросится.
      onBack={pendingSite ? handleBack : undefined}
      size="lg"
    >
      {pendingSite ? (
        <LibSocialCodeStep key={pendingSourceId} source={source} onStep={handleStep} />
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
