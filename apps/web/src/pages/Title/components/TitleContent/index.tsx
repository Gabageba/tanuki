import { Tabs } from '@mantine/core';
import { InfoIcon, ListDashesIcon } from '@phosphor-icons/react';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import TitleInfoTabContent from './TitleInfoTabContent';
import { SORT_DIRECTION, SortDirectionSchema, type Branch, type Title } from '@tanuki/contracts';
import TitleChaptersTabContent from '../TitleChaptersTabContent';

const TITLE_CONTENT_TABS = {
  INFO: 'info',
  CHAPTERS: 'chapters',
} as const;

type Props = {
  title: Title;
  branches: Branch[];
};

function TitleContent({ title, branches }: Props) {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    setSearchParams(
      (prev) => {
        if (SortDirectionSchema.safeParse(prev.get('direction')).success) return prev;

        const next = new URLSearchParams(prev);
        next.set('direction', SORT_DIRECTION.DESC);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

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
        content: <TitleChaptersTabContent branches={branches} titleId={title.id} />,
      },
    ],
    [title, t, branches],
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
