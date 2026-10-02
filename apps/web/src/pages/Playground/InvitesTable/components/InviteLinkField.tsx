import { ActionIcon, CopyButton, TextInput, Tooltip } from '@mantine/core';
import { CheckIcon, CopyIcon, LinkIcon } from '@phosphor-icons/react';
import { getInviteLink } from '../lib';

type Props = {
  code: string;
  /** Кнопка копирования внутри поля; без неё копируют отдельной кнопкой под полем. */
  withCopy?: boolean;
};

/** Ссылка на регистрацию только для чтения — моноширинно, это идентификатор. */
function InviteLinkField({ code, withCopy = true }: Props) {
  const link = getInviteLink(code);

  return (
    <TextInput
      value={link}
      readOnly
      ff="monospace"
      aria-label="Ссылка-приглашение"
      leftSection={<LinkIcon />}
      onFocus={(event) => event.currentTarget.select()}
      rightSection={
        withCopy && (
          <CopyButton value={link}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Скопировано' : 'Скопировать'} withArrow>
                <ActionIcon
                  variant="subtle"
                  color={copied ? 'teal' : 'gray'}
                  onClick={copy}
                  aria-label="Скопировать ссылку"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        )
      }
    />
  );
}

export default InviteLinkField;
