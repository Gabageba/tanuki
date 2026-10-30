import { useCallback, useMemo, useRef } from 'react';
import { Tabs, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CookieIcon, PasswordIcon, SignInIcon } from '@phosphor-icons/react';
import { SOURCE_AUTH_FAMILY, type LinkSourceAccountRequest, type Source } from '@tanuki/contracts';
import { getSourceAuthFamilyTitle } from '@/entities/source-account/lib';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import useLinkSourceAccount from '../hooks/useLinkSourceAccount';
import PasswordAccountForm from './PasswordAccountForm';
import SourceSessionForm from './SourceSessionForm';

type Props = { source: Source | undefined; opened: boolean; onClose: () => void };

const LOGIN_TAB = { PASSWORD: 'password', TOKEN: 'token' } as const;

/** Основной вход — логин/почта и пароль; для соцсетей и 2FA остаётся перенос сессии. */
function LinkRemangaModal({ source, opened, onClose }: Props) {
  const { t } = useTranslation();
  const linkAccount = useLinkSourceAccount();
  const operationId = useRef(0);
  const close = useCallback(() => {
    operationId.current += 1;
    onClose();
  }, [onClose]);
  const submit = useCallback(
    async (values: LinkSourceAccountRequest) => {
      const id = ++operationId.current;
      try {
        await linkAccount.mutateAsync({ family: SOURCE_AUTH_FAMILY.REMANGA, ...values });
        if (operationId.current === id) close();
      } catch (error) {
        if (operationId.current === id) throw error;
      }
    },
    [close, linkAccount],
  );

  const TABS = useMemo(
    () => [
      {
        id: LOGIN_TAB.PASSWORD,
        title: t('loginAndPassword'),
        icon: <PasswordIcon />,
        content: (
          <PasswordAccountForm
            isPending={linkAccount.isPending}
            onSubmit={submit}
            onCancel={close}
            meta={
              <Text c="dimmed" fz={13}>
                {t('transferSessionForYandexOrTwoFactor')}
              </Text>
            }
          />
        ),
      },
      {
        id: LOGIN_TAB.TOKEN,
        title: t('token'),
        icon: <CookieIcon />,
        content: (
          <SourceSessionForm
            family={SOURCE_AUTH_FAMILY.REMANGA}
            cookieName="auth:token"
            source={source}
            description={t('transferBrowserSession')}
            onClose={close}
          />
        ),
      },
    ],
    [close, linkAccount.isPending, source, submit, t],
  );

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={SignInIcon}
      opened={opened}
      onClose={close}
      title={t('logInToName', { name: getSourceAuthFamilyTitle(SOURCE_AUTH_FAMILY.REMANGA) })}
    >
      <Tabs
        defaultValue={LOGIN_TAB.PASSWORD}
        keepMounted={false}
        onChange={() => {
          operationId.current += 1;
        }}
      >
        <Tabs.List>
          {TABS.map(({ id, title, icon }) => (
            <Tabs.Tab key={id} value={id} leftSection={icon}>
              {title}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {TABS.map(({ id, content }) => (
          <Tabs.Panel key={id} value={id} mt="md">
            {content}
          </Tabs.Panel>
        ))}
      </Tabs>
    </ToneModal>
  );
}

export default LinkRemangaModal;
