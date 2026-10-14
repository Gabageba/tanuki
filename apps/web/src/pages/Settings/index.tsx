import { Scroller, Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BellIcon,
  BookmarkSimpleIcon,
  BookOpenTextIcon,
  GearIcon,
  PlugsIcon,
  SparkleIcon,
  TrayArrowDownIcon,
} from '@phosphor-icons/react';
import { useMemo } from 'react';
import usePushConfig from '@/entities/notification/hooks/usePushConfig';
import PageLayout from '@/shared/ui/PageLayout';
import useUserSettings from '@/shared/hooks/useUserSettings';
import { SETTINGS_TAB_SEARCH_PARAM, SETTINGS_TABS } from '@/shared/lib/routes';
import SettingsBookmarks from './components/SettingsBookmarks';
import SettingsDownloads from './components/SettingsDownloads';
import SettingsNotifications from './components/SettingsNotifications';
import SettingsGeneral from './components/SettingsGeneral';
import SettingsReader from './components/SettingsReader';
import SettingsSelections from './components/SettingsSelections';
import SettingsSources from './components/SettingsSources';
import { isSettingsTab } from './lib';

function Settings() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Push — опция инстанса: без ключей на сервере вкладке нечего показать.
  const { data: pushConfig } = usePushConfig();
  const tabParam = searchParams.get(SETTINGS_TAB_SEARCH_PARAM);

  const handleTabChange = (value: string | null) => {
    if (!isSettingsTab(value)) return;
    setSearchParams({ [SETTINGS_TAB_SEARCH_PARAM]: value }, { replace: true });
  };

  const TABS = useMemo(
    () => [
      {
        id: SETTINGS_TABS.GENERAL,
        title: t('general'),
        icon: <GearIcon />,
        content: <SettingsGeneral />,
      },
      {
        id: SETTINGS_TABS.SOURCES,
        title: t('sources'),
        icon: <PlugsIcon />,
        content: <SettingsSources />,
      },
      {
        id: SETTINGS_TABS.SELECTIONS,
        title: t('selections'),
        icon: <SparkleIcon />,
        content: <SettingsSelections />,
      },
      {
        id: SETTINGS_TABS.READER,
        title: t('reader'),
        icon: <BookOpenTextIcon />,
        content: <SettingsReader />,
      },
      {
        id: SETTINGS_TABS.BOOKMARKS,
        title: t('bookmarks'),
        icon: <BookmarkSimpleIcon />,
        content: <SettingsBookmarks />,
      },
      {
        id: SETTINGS_TABS.DOWNLOADS,
        title: t('downloads'),
        icon: <TrayArrowDownIcon />,
        content: <SettingsDownloads />,
      },
      ...(pushConfig?.enabled
        ? [
            {
              id: SETTINGS_TABS.NOTIFICATIONS,
              title: t('notifications'),
              icon: <BellIcon />,
              content: <SettingsNotifications />,
            },
          ]
        : []),
    ],
    [t, pushConfig?.enabled],
  );

  const activeTab =
    isSettingsTab(tabParam) && TABS.some(({ id }) => id === tabParam)
      ? tabParam
      : SETTINGS_TABS.GENERAL;

  return (
    <PageLayout useQuery={useUserSettings}>
      <PageLayout.Content title={t('settings')}>
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

export default Settings;
