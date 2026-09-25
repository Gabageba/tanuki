import { Group, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { USERNAME_PATTERN } from '@tanuki/contracts';
import PageLayout from '@/shared/ui/PageLayout';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import EditableText from '@/shared/ui/EditableText';
import useDateFormat from '@/shared/hooks/useDateFormat';
import type { CurrentUserQuery } from '../models';
import useUpdateProfile from '../hooks/useUpdateProfile';
import ProfileAvatar from './ProfileAvatar';

const DAY_MS = 24 * 60 * 60 * 1000;

const getDaysSince = (isoDate: string) =>
  Math.floor((Date.now() - new Date(isoDate).getTime()) / DAY_MS);

function ProfileInfo() {
  const { t } = useTranslation();
  const { data } = PageLayout.useQuery<CurrentUserQuery>();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { formatMonthYear } = useDateFormat();

  const createdAt = data?.createdAt;

  return (
    <Stack>
      <Group wrap="nowrap" align="flex-start">
        <ProfileAvatar src={data?.avatarUrl} name={data?.username} />
        <Stack gap={4} flex={1} miw={0}>
          <EditableText
            value={data?.username ?? ''}
            onSave={(username) => updateProfile({ username })}
            validate={(username) => (USERNAME_PATTERN.test(username) ? null : t('usernameRules'))}
            maxLength={24}
            order={2}
            lh={1.3}
          />
          <MidDotGroup
            lh={1}
            text={{ fz: 12, c: 'dimmed' }}
            items={[
              createdAt && t('inTanukiSince', { date: formatMonthYear(createdAt) }),
              createdAt && t('countDays', { count: getDaysSince(createdAt) }),
            ]}
          />
        </Stack>
      </Group>
    </Stack>
  );
}

export default ProfileInfo;
