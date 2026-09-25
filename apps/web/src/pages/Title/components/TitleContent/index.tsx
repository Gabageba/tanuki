import { Tabs } from '@mantine/core';
import { InfoIcon, ListDashesIcon } from '@phosphor-icons/react';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import TitleInfoTabContent from './TitleInfoTabContent';
import { SORT_DIRECTION, SortDirectionSchema, type Branch, type Title } from '@tanuki/contracts';
import TitleChaptersTabContent from '../TitleChaptersTabContent';
import { TITLE_TAB_SEARCH_PARAM, TITLE_TABS, type TitleTab } from '@/shared/lib/routes';

const isTitleTab = (value: string | null): value is TitleTab =>
  Object.values<string | null>(TITLE_TABS).includes(value);

type Props = {
  title: Title;
  branches: Branch[];
};

function TitleContent({ title, branches }: Props) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get(TITLE_TAB_SEARCH_PARAM);
  const activeTab = isTitleTab(tabParam) ? tabParam : TITLE_TABS.INFO;

  const handleTabChange = (value: string | null) => {
    if (!isTitleTab(value)) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(TITLE_TAB_SEARCH_PARAM, value);
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const hasTab = isTitleTab(prev.get(TITLE_TAB_SEARCH_PARAM));
        const hasDirection = SortDirectionSchema.safeParse(prev.get('direction')).success;
        if (hasTab && hasDirection) return prev;

        const next = new URLSearchParams(prev);
        if (!hasTab) next.set(TITLE_TAB_SEARCH_PARAM, TITLE_TABS.INFO);
        if (!hasDirection) next.set('direction', SORT_DIRECTION.DESC);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const TABS = useMemo(
    () => [
      {
        id: TITLE_TABS.INFO,
        title: t('aboutTitle'),
        icon: <InfoIcon />,
        content: <TitleInfoTabContent title={title} />,
      },
      {
        id: TITLE_TABS.CHAPTERS,
        title: t('chapters'),
        icon: <ListDashesIcon />,
        content: <TitleChaptersTabContent branches={branches} titleId={title.id} />,
      },
    ],
    [title, t, branches],
  );

  return (
    <Tabs value={activeTab} onChange={handleTabChange}>
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
