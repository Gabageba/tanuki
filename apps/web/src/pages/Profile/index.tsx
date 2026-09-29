import { Scroller, Stack, Tabs } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartBarIcon, DatabaseIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import PageLayout from '@/shared/ui/PageLayout';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import ProfileInfo from './components/ProfileInfo';
import ProfileStatistics from './components/ProfileStatistics';
import ProfileSignInAndSecurity from './components/ProfileSignInAndSecurity';
import ProfileData from './components/ProfileData';
import { PROFILE_TABS } from './models';

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
        id: PROFILE_TABS.SIGN_IN_AND_SECURITY,
        title: t('signInAndSecurity'),
        icon: <ShieldCheckIcon />,
        content: <ProfileSignInAndSecurity />,
      },
      {
        id: PROFILE_TABS.DATA,
        title: t('data'),
        icon: <DatabaseIcon />,
        content: <ProfileData />,
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
