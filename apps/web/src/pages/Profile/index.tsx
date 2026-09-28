import { Scroller, Stack, Tabs } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartBarIcon, KeyIcon, LinkSimpleIcon } from '@phosphor-icons/react';
import PageLayout from '@/shared/ui/PageLayout';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import ProfileInfo from './components/ProfileInfo';
import ProfileStatistics from './components/ProfileStatistics';

const PROFILE_TABS = {
  STATISTICS: 'statistics',
  LOGIN_AND_LINKS: 'loginAndLinks',
  SAFETY: 'safety',
} as const;

function Profile() {
  const { t } = useTranslation();

  const TABS = useMemo(
    () => [
      {
        id: PROFILE_TABS.STATISTICS,
        title: t('statistics'),
        icon: <ChartBarIcon />,
        content: <ProfileStatistics />,
      },
      {
        id: PROFILE_TABS.LOGIN_AND_LINKS,
        title: t('loginAndLinking'),
        icon: <LinkSimpleIcon />,
        content: <></>,
      },
      {
        id: PROFILE_TABS.SAFETY,
        title: t('security'),
        icon: <KeyIcon />,
        content: <></>,
      },
    ],
    [t],
  );
  return (
    <PageLayout useQuery={useCurrentUser}>
      <PageLayout.Content>
        <Stack gap="lg">
          <ProfileInfo />
          <Tabs defaultValue={PROFILE_TABS.STATISTICS}>
            <Tabs.List>
              <Scroller>
                {TABS.map(({ title, id, icon }) => (
                  <Tabs.Tab value={id} key={id} leftSection={icon}>
                    {title}
                  </Tabs.Tab>
                ))}
              </Scroller>
            </Tabs.List>

            {TABS.map(({ id, content }) => (
              <Tabs.Panel key={id} value={id}>
                {content}
              </Tabs.Panel>
            ))}
          </Tabs>
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Profile;
