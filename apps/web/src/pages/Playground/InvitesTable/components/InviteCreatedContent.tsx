import { Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { CheckCircleIcon } from '@phosphor-icons/react';
import { formatWordedDate, getRoleLabel } from '../lib';
import { MESSAGE_PATTERN, MESSAGE_TONE, type MessagePattern, type MockInvite } from '../models';
import InviteLinkField from './InviteLinkField';
import ModalMessage from './ModalMessage';

type Props = {
  invite: MockInvite;
  isLinkStored: boolean;
  pattern?: MessagePattern;
};

/** Что за ссылка, до какого числа она действует и что будет, если её потерять. */
function InviteCreatedContent({ invite, isLinkStored, pattern = MESSAGE_PATTERN.CURRENT }: Props) {
  const main = `Отправьте ссылку тому, кого приглашаете. По ней зарегистрируется один человек с ролью «${getRoleLabel(invite.role)}», до ${formatWordedDate(invite.expiresAt)} г.`;
  const lostLink = isLinkStored
    ? 'Потерять ссылку не страшно — её можно скопировать снова из карточки приглашения.'
    : 'Ссылку мы показываем только сейчас. Если потеряете — приглашение можно перевыпустить из его карточки.';

  return (
    <Stack gap="md" mb="md">
      <ModalMessage
        pattern={pattern}
        tone={MESSAGE_TONE.SUCCESS}
        icon={CheckCircleIcon}
        main={main}
        details={[lostLink]}
        current={
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <ThemeIcon variant="light" color="teal" size="lg" radius="xl" flex="none">
              <CheckCircleIcon size={20} />
            </ThemeIcon>
            <Text fz="sm">{main}</Text>
          </Group>
        }
      />
      <InviteLinkField code={invite.code} />
      {pattern === MESSAGE_PATTERN.CURRENT && (
        <Text c="dimmed" fz={13}>
          {lostLink}
        </Text>
      )}
    </Stack>
  );
}

export default InviteCreatedContent;
