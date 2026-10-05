import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { CreateInviteResponse } from '@tanuki/contracts';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { getUserRoleLabel } from '../../models';
import InviteLinkField from './InviteLinkField';

type Props = {
  invite: CreateInviteResponse;
};

/** Кому ссылка, до какого числа действует и что делать, если её потерять. */
function InviteCreatedContent({ invite }: Props) {
  const { t } = useTranslation();
  const { formatDateLong } = useDateFormat();

  return (
    <Stack gap="md">
      <Text fz="sm">
        {t('sendLinkToInvitee', {
          role: getUserRoleLabel(invite.role, t),
          date: formatDateLong(invite.expiresAt),
        })}
      </Text>
      <InviteLinkField code={invite.code} />
      <Text c="dimmed" fz={13}>
        {t('linkShownOnlyNowCanReissue')}
      </Text>
    </Stack>
  );
}

export default InviteCreatedContent;
