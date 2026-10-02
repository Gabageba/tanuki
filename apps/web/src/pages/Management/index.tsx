import { Scroller, Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TicketIcon, UsersIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import PageLayout from '@/shared/ui/PageLayout';
import { MANAGEMENT_TAB_SEARCH_PARAM, MANAGEMENT_TABS, ROUTE_PATHS } from '@/shared/lib/routes';
import CreateInviteButton from './components/ManagementInvites/CreateInviteButton';
import ManagementInvites from './components/ManagementInvites';
import ManagementUsers from './components/ManagementUsers';
import { isManagementTab } from './lib';

function Management() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get(MANAGEMENT_TAB_SEARCH_PARAM);
  const activeTab = isManagementTab(tabParam) ? tabParam : MANAGEMENT_TABS.USERS;

  const handleTabChange = (value: string | null) => {
    if (!isManagementTab(value)) return;
    setSearchParams({ [MANAGEMENT_TAB_SEARCH_PARAM]: value }, { replace: true });
  };

  const TABS = useMemo(
    () => [
      {
        id: MANAGEMENT_TABS.USERS,
        title: t('users'),
        icon: <UsersIcon />,
        content: <ManagementUsers />,
      },
      {
        id: MANAGEMENT_TABS.INVITES,
        title: t('invites'),
        icon: <TicketIcon />,
        content: <ManagementInvites />,
      },
    ],
    [t],
  );

  return (
    <PageLayout>
      <PageLayout.Content
        title={t('management')}
        actions={activeTab === MANAGEMENT_TABS.INVITES && <CreateInviteButton />}
        goBack={{ path: ROUTE_PATHS.SOURCES }}
      >
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Scroller>
              {TABS.map(({ id, icon, title }) => (
                <Tabs.Tab key={id} value={id} leftSection={icon}>
                  {title}
                </Tabs.Tab>
              ))}
            </Scroller>
          </Tabs.List>
          {TABS.map(({ id, content }) => (
            <Tabs.Panel value={id} key={id} mt="lg">
              {content}
            </Tabs.Panel>
          ))}
        </Tabs>
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Management;
