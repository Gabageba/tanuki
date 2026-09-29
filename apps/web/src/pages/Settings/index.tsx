import { Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { GearIcon, PlugsIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import PageLayout from '@/shared/ui/PageLayout';
import useUserSettings from '@/shared/hooks/useUserSettings';
import { SETTINGS_TAB_SEARCH_PARAM, SETTINGS_TABS } from '@/shared/lib/routes';
import SettingsGeneral from './components/SettingsGeneral';
import SettingsSources from './components/SettingsSources';
import { isSettingsTab } from './lib';

function Settings() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get(SETTINGS_TAB_SEARCH_PARAM);
  const activeTab = isSettingsTab(tabParam) ? tabParam : SETTINGS_TABS.GENERAL;

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
    ],
    [t],
  );

  return (
    <PageLayout useQuery={useUserSettings}>
      <PageLayout.Content title={t('settings')}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            {TABS.map(({ id, icon, title }) => (
              <Tabs.Tab key={id} value={id} leftSection={icon}>
                {title}
              </Tabs.Tab>
            ))}
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
