import { Tabs } from '@mantine/core';
import { InfoIcon, ListDashesIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import MangaInfoTabContent from './MangaInfoTabContent';
import type { Manga } from '@tanuki/contracts';

const MANGA_CONTENT_TABS = {
  INFO: 'info',
  CHAPTERS: 'chapters',
} as const;

type Props = {
  manga: Manga;
};

function MangaContent({ manga }: Props) {
  const TABS = useMemo(
    () => [
      {
        id: MANGA_CONTENT_TABS.INFO,
        title: 'О тайтле',
        icon: <InfoIcon />,
        content: <MangaInfoTabContent manga={manga} />,
      },
      {
        id: MANGA_CONTENT_TABS.CHAPTERS,
        title: 'Главы',
        icon: <ListDashesIcon />,
        content: <>chapters</>,
      },
    ],
    [manga],
  );

  return (
    <Tabs defaultValue={MANGA_CONTENT_TABS.INFO}>
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

export default MangaContent;
