import { Tabs, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { KeyIcon, PasswordIcon, SignInIcon } from '@phosphor-icons/react';
import { SOURCE_AUTH_FAMILY, type Source } from '@tanuki/contracts';
import useLinkLibSocialAccount from '../hooks/useLinkLibSocialAccount';
import { getSourceAuthFamilyTitle } from '@/entities/source-account/lib';
import PasswordAccountForm from './PasswordAccountForm';
import LibSocialTokenForm from './LibSocialTokenForm';
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
 * сайте сети. Запасной — перенос токена из localStorage сайта, для входящих туда через VK или
 * Яндекс: токен подходит только своему сайту, поэтому переносится для каждого отдельно.
 */
function LinkLibSocialModal({ sources, defaultTokenSourceId, opened, onClose }: Props) {
  const { t } = useTranslation();
  const linkAccount = useLinkLibSocialAccount();

  const TABS = [
    {
      id: LOGIN_TAB.PASSWORD,
      icon: <PasswordIcon />,
      title: t('loginAndPassword'),
      content: (
        <PasswordAccountForm
          isPending={linkAccount.isPending}
          onSubmit={(values) => linkAccount.mutateAsync(values).then(onClose)}
          onCancel={onClose}
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
          onClose={onClose}
        />
      ),
    },
  ];

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={SignInIcon}
      opened={opened}
      onClose={onClose}
      title={t('logInToName', { name: getSourceAuthFamilyTitle(SOURCE_AUTH_FAMILY.LIBSOCIAL) })}
      size="lg"
    >
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
    </ToneModal>
  );
}

export default LinkLibSocialModal;
