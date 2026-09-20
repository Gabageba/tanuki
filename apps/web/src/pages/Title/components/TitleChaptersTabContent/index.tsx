import { Button, Group, Scroller, Stack, Tabs, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { Branch } from '@tanuki/contracts';
import TitleChaptersList from './TitleChaptersList';
import TitleChaptersSettings from './TitleChaptersSettings';

type Props = {
  branches: Branch[];
  titleId: string;
};

function TitleChaptersTabContent({ branches, titleId }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>(branches[0]?.id || null);

  return (
    <Tabs variant="selectable" value={activeTab} onChange={setActiveTab}>
      <Stack gap="sm">
        {branches.length > 1 && (
          <Tabs.List>
            <Scroller>
              <Group gap={8} wrap="nowrap">
                {branches.map((branch) => (
                  <Tabs.Tab
                    value={branch.id}
                    key={branch.id}
                    rightSection={
                      <Text c={activeTab === branch.id ? 'terracotta' : 'dimmed'} fz={12}>
                        {t('countChaptersAbbrev', { count: branch.chaptersCount })}
                      </Text>
                    }
                  >
                    {branch.name}
                  </Tabs.Tab>
                ))}
              </Group>
            </Scroller>
          </Tabs.List>
        )}
        <Group justify="space-between" gap="sm">
          <TitleChaptersSettings />
          <Button>{t('downloadAll')}</Button>
        </Group>
        {branches.map((branch) => (
          <TitleChaptersList branch={branch} key={branch.id} titleId={titleId} />
        ))}
      </Stack>
    </Tabs>
  );
}

export default TitleChaptersTabContent;
