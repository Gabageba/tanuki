import { useDisclosure } from '@mantine/hooks';
import { Button, Group } from '@mantine/core';
import { ArrowClockwiseIcon, LinkBreakIcon, SignInIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import {
  SOURCE_ACCOUNT_STATUS,
  SOURCE_AUTH_FAMILY,
  SOURCE_STATUS_REASON,
  isLibSocialAuthFamily,
  type SourceAccount,
  type SourceAuthFamily,
} from '@tanuki/contracts';
import LinkSessionAccountModal from './LinkSessionAccountModal';
import LinkRemangaModal from './LinkRemangaModal';
import LinkLibSocialModal from './LinkLibSocialModal';
import LinkPasswordAccountModal from './LinkPasswordAccountModal';
import useUnlinkSourceAccount from '../hooks/useUnlinkSourceAccount';

type Props = {
  family: SourceAuthFamily;
  sources: Source[];
  account: SourceAccount | undefined;
  sourcesWithoutLogin: Source[];
  isLinkingAvailable: boolean;
};

function SourceAccountStatusActions({
  account,
  sources,
  family,
  sourcesWithoutLogin,
  isLinkingAvailable,
}: Props) {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const unlink = useUnlinkSourceAccount();

  const isLoginAvailable =
    isLinkingAvailable &&
    sources.some((source) => source.statusReason !== SOURCE_STATUS_REASON.BROKEN);
  const isReloginRequired = account?.status === SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED;

  return (
    <>
      <Group gap={8} flex="none" maw="100%">
        {(!account || sourcesWithoutLogin.length > 0) && (
          <Button
            size="xs"
            variant="muted"
            color="terracotta"
            leftSection={<SignInIcon />}
            disabled={!isLoginAvailable}
            onClick={open}
          >
            {t('logIn')}
          </Button>
        )}
        {account && (
          <>
            {isReloginRequired && (
              <Button
                size="xs"
                variant="muted"
                color="gold"
                leftSection={<ArrowClockwiseIcon />}
                disabled={!isLoginAvailable}
                onClick={open}
              >
                {t('logInAgain')}
              </Button>
            )}
            <Button
              size="xs"
              variant="muted"
              color="red"
              leftSection={<LinkBreakIcon />}
              disabled={!isLinkingAvailable}
              onClick={() => unlink.mutate(family)}
            >
              {t('unlink')}
            </Button>
          </>
        )}
      </Group>

      {isLibSocialAuthFamily(family) && (
        <LinkLibSocialModal source={sources[0]!} opened={opened} onClose={close} />
      )}
      {family === SOURCE_AUTH_FAMILY.INUKO && (
        <LinkSessionAccountModal
          family={family}
          cookieName="__otaku_session"
          description={t('loginProtectedByCaptcha')}
          source={sources[0]}
          opened={opened}
          onClose={close}
        />
      )}
      {family === SOURCE_AUTH_FAMILY.REMANGA && (
        <LinkRemangaModal source={sources[0]} opened={opened} onClose={close} />
      )}
      {family === SOURCE_AUTH_FAMILY.SENKURO && (
        <LinkSessionAccountModal
          family={family}
          cookieName="access_token"
          description={t('loginProtectedByCaptcha')}
          source={sources[0]}
          opened={opened}
          onClose={close}
        />
      )}
      {!isLibSocialAuthFamily(family) &&
        family !== SOURCE_AUTH_FAMILY.INUKO &&
        family !== SOURCE_AUTH_FAMILY.REMANGA &&
        family !== SOURCE_AUTH_FAMILY.SENKURO && (
          <LinkPasswordAccountModal family={family} opened={opened} onClose={close} />
        )}
    </>
  );
}

export default SourceAccountStatusActions;
