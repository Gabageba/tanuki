import { Badge, Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { SignOutIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import PageLayout from '@/shared/ui/PageLayout';
import useSkeletonTiming from '@/shared/ui/QueryBlock/hooks/useSkeletonTiming';
import useRevokeOtherSessions from './hooks/useRevokeOtherSessions';
import useRevokeSession from './hooks/useRevokeSession';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import useDateFormat from '@/shared/hooks/useDateFormat';
import type useProfileQueries from '../../hooks/useProfileQueries';
import { getDeviceTypeIcon } from './lib';

function SessionsSection() {
  const { t } = useTranslation();
  const sessionsQuery = PageLayout.useQueries<typeof useProfileQueries>().sessions;
  const sessions = sessionsQuery.data;
  const { isSkeleton } = useSkeletonTiming(sessionsQuery);
  const revokeOtherSessions = useRevokeOtherSessions();
  const revokeSession = useRevokeSession();
  const { formatRelative } = useDateFormat();

  const hasOtherSessions = sessions?.some((session) => !session.isCurrent) ?? false;

  return (
    <GroupedList label={t('sessions')} loading={isSkeleton} skeletonRows={2}>
      {sessions?.map((session) => (
        <GroupedList.Row
          key={session.id}
          icon={getDeviceTypeIcon(session.deviceType)}
          title={
            <Group gap={8}>
              <MidDotGroup
                text={{ inherit: true }}
                items={session.browser ? [session.browser, session.os] : [t('unknownDevice')]}
              />
              {session.isCurrent && (
                <Badge variant="light" size="xs">
                  {t('you')}
                </Badge>
              )}
            </Group>
          }
          description={
            <MidDotGroup
              text={{ inherit: true }}
              items={[session.ip, !session.isCurrent && formatRelative(session.lastSeenAt)]}
            />
          }
          actionProps={
            (!session.isCurrent && {
              children: t('end'),
              color: 'red',
              variant: 'muted',
              leftSection: <SignOutIcon />,
              loading: revokeSession.isPending && revokeSession.variables === session.id,
              onClick: () => revokeSession.mutate(session.id),
            }) ||
            undefined
          }
        />
      ))}
      {hasOtherSessions && (
        <GroupedList.Footer>
          <Button
            size="xs"
            variant="muted"
            color="red"
            leftSection={<SignOutIcon />}
            loading={revokeOtherSessions.isPending}
            onClick={() => revokeOtherSessions.mutate()}
          >
            {t('endAllOtherSessions')}
          </Button>
        </GroupedList.Footer>
      )}
    </GroupedList>
  );
}

export default SessionsSection;
