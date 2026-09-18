import { Tabs } from '@mantine/core';
import { InfoIcon, ListDashesIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import TitleInfoTabContent from './TitleInfoTabContent';
import type { Branch, Title } from '@tanuki/contracts';

const TITLE_CONTENT_TABS = {
  INFO: 'info',
  CHAPTERS: 'chapters',
} as const;

type Props = {
  title: Title;
  branches: Branch[];
};

function TitleContent({ title }: Props) {
  const { t } = useTranslation();
  const TABS = useMemo(
    () => [
      {
        id: TITLE_CONTENT_TABS.INFO,
        title: t('aboutTitle'),
        icon: <InfoIcon />,
        content: <TitleInfoTabContent title={title} />,
      },
      {
        id: TITLE_CONTENT_TABS.CHAPTERS,
        title: t('chapters'),
        icon: <ListDashesIcon />,
        content: <>chapters</>,
      },
    ],
    [title, t],
  );

  return (
    <Tabs defaultValue={TITLE_CONTENT_TABS.INFO}>
      <Tabs.List>
        {TABS.map((tab) => (
          <Tabs.Tab key={tab.id} value={tab.id} leftSection={tab.icon}>
            {tab.title}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {TABS.map((tab) => (
        <Tabs.Panel key={tab.id} value={tab.id} py="md">
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

export default TitleContent;
