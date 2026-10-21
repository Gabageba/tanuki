import { EmptyState, Group, Scroller, Stack, Tabs, Text } from '@mantine/core';
import { EmptyIcon, UsersThreeIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Branch } from '@tanuki/contracts';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import PageLayout from '@/shared/ui/PageLayout';
import type { TitlePageParams } from '../../models';
import TitleChaptersList from './TitleChaptersList';

type Props = {
  branches: Branch[];
  titleId: string;
};

function TitleChaptersTabContent({ branches, titleId }: Props) {
  const { t } = useTranslation();
  const { params, setParams } = PageLayout.useParams<TitlePageParams>();
  // Выбранной ветки могло не стать (источник пересобрал ветки) — тогда первая.
  const activeTab =
    branches.find(({ id }) => id === params.branchId)?.id ?? branches[0]?.id ?? null;

  if (branches.length === 0) {
    return (
      <EmptyState
        title={t('chaptersNotFound')}
        description={t('sourceHasNoChaptersYet')}
        size="sm"
        icon={<EmptyIcon />}
      />
    );
  }

  return (
    <Tabs
      variant="tile"
      value={activeTab}
      onChange={(branchId) => setParams({ ...params, branchId })}
    >
      <Stack gap="sm">
        {branches.length > 1 && (
          <Tabs.List>
            <Scroller>
              <Group gap={8} wrap="nowrap">
                {branches.map((branch) => (
                  <Tabs.Tab
                    value={branch.id}
                    key={branch.id}
                    leftSection={<UsersThreeIcon />}
                    rightSection={
                      <Text c={activeTab === branch.id ? PRIMARY_COLOR : 'dimmed'} fz={12}>
                        {t('countChaptersAbbrev', { count: branch.chaptersCount })}
                      </Text>
                    }
                  >
                    {branch.name ?? t('untitled')}
                  </Tabs.Tab>
                ))}
              </Group>
            </Scroller>
          </Tabs.List>
        )}
        {branches.map((branch) => (
          <TitleChaptersList branch={branch} key={branch.id} titleId={titleId} />
        ))}
      </Stack>
    </Tabs>
  );
}

export default TitleChaptersTabContent;
