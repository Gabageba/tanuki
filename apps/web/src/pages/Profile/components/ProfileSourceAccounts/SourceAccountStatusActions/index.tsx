import { useDisclosure } from '@mantine/hooks';
import { Button } from '@mantine/core';
import { ArrowClockwiseIcon, SignInIcon } from '@phosphor-icons/react';
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
import SourceAccountMenu from './SourceAccountMenu';

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

  const isLoginAvailable =
    isLinkingAvailable &&
    sources.some((source) => source.statusReason !== SOURCE_STATUS_REASON.BROKEN);
  const isReloginRequired = account?.status === SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED;
  const hasLoginAction = !account || sourcesWithoutLogin.length > 0 || isReloginRequired;
  const actionColor = isReloginRequired ? 'gold' : 'terracotta';

  return (
    <>
      <Button.Group flex="none" maw="100%">
        {hasLoginAction && (
          <Button
            size="xs"
            variant="muted"
            color={actionColor}
            leftSection={isReloginRequired ? <ArrowClockwiseIcon /> : <SignInIcon />}
            disabled={!isLoginAvailable}
            onClick={open}
          >
            {t('logIn')}
          </Button>
        )}
        <SourceAccountMenu
          account={account}
          isLinkingAvailable={isLinkingAvailable}
          color={hasLoginAction ? actionColor : 'gray'}
        />
      </Button.Group>

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
        family !== SOURCE_AUTH_FAMILY.HENTAICHAN_CC &&
        family !== SOURCE_AUTH_FAMILY.INUKO &&
        family !== SOURCE_AUTH_FAMILY.REMANGA &&
        family !== SOURCE_AUTH_FAMILY.SENKURO && (
          <LinkPasswordAccountModal family={family} opened={opened} onClose={close} />
        )}
      {family === SOURCE_AUTH_FAMILY.HENTAICHAN_CC && (
        <LinkSessionAccountModal
          family={family}
          cookieName="__Secure-better-auth.session_token"
          description={t('loginProtectedByCaptcha')}
          source={sources[0]}
          opened={opened}
          onClose={close}
        />
      )}
    </>
  );
}

export default SourceAccountStatusActions;
