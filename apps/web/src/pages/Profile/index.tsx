import { Scroller, Stack, Tabs } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { ChartBarIcon, DatabaseIcon, KeyIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import PageLayout from '@/shared/ui/PageLayout';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import ProfileInfo from './components/ProfileInfo';
import ProfileStatistics from './components/ProfileStatistics';
import ProfileSignInAndSecurity from './components/ProfileSignInAndSecurity';
import ProfileData from './components/ProfileData';
import ProfileSourceAccounts from './components/ProfileSourceAccounts';
import { PROFILE_TAB_SEARCH_PARAM, PROFILE_TABS } from '@/shared/lib/routes';
import { isProfileTab } from './lib';

function Profile() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get(PROFILE_TAB_SEARCH_PARAM);
  const activeTab = isProfileTab(tabParam) ? tabParam : PROFILE_TABS.STATISTICS;

  const handleTabChange = (value: string | null) => {
    if (!isProfileTab(value)) return;
    setSearchParams({ [PROFILE_TAB_SEARCH_PARAM]: value }, { replace: true });
  };

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
        id: PROFILE_TABS.SOURCE_ACCOUNTS,
        title: t('sourceAccounts'),
        icon: <KeyIcon />,
        content: <ProfileSourceAccounts />,
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
          <Tabs value={activeTab} onChange={handleTabChange}>
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
