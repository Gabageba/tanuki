import { ActionIcon, CopyButton, TextInput, Tooltip } from '@mantine/core';
import { CheckIcon, CopyIcon, LinkIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { getInviteLink } from './models';

type Props = {
  code: string;
};

/** Ссылка на регистрацию только для чтения — моноширинно, это идентификатор; копируется кнопкой в
 *  поле. */
function InviteLinkField({ code }: Props) {
  const { t } = useTranslation();
  const link = getInviteLink(code);

  return (
    <TextInput
      value={link}
      readOnly
      ff="monospace"
      aria-label={t('inviteLink')}
      leftSection={<LinkIcon />}
      onFocus={(event) => event.currentTarget.select()}
      rightSection={
        <CopyButton value={link}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? t('copied') : t('copy')} withArrow>
              <ActionIcon
                variant="subtle"
                color={copied ? 'teal' : 'gray'}
                onClick={copy}
                aria-label={t('copyLink')}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      }
    />
  );
}

export default InviteLinkField;
