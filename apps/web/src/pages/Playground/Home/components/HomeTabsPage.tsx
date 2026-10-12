import { useMemo } from 'react';
import { Divider, Group, Stack, Tabs, Title } from '@mantine/core';
import { BookOpenIcon, SparkleIcon } from '@phosphor-icons/react';
import { MOCK_CONTINUE, MOCK_HOME_ALL } from '../mocks';
import { SECTION_STEP } from '../models';
import AllSourcesLink from './AllSourcesLink';
import ContinueReading from './ContinueReading';
import HomeSourceSection from './HomeSourceSection';

/** P2 — вкладки «Моё» и «Подборки» вверху главной. «Моё» — «Продолжить» сеткой: лента на вкладке
 *  одна. «Подборки» — источники подряд с вкладками блоков (S2b). */
function HomeTabsPage() {
  const TABS = useMemo(
    () => [
      {
        id: 'mine',
        title: 'Моё',
        icon: <BookOpenIcon />,
        content: <ContinueReading items={MOCK_CONTINUE} isGrid withTitle={false} />,
      },
      {
        id: 'selections',
        title: 'Подборки',
        icon: <SparkleIcon />,
        content: (
          <Stack gap={0}>
            {MOCK_HOME_ALL.slice(0, 3).map((home, index) => (
              <Stack key={home.source.id} gap={0}>
                {index > 0 && <Divider my="xl" />}
                <HomeSourceSection home={home} step={SECTION_STEP.TABS_TEXT} />
              </Stack>
            ))}
          </Stack>
        ),
      },
    ],
    [],
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Title order={2}>Главная</Title>
        <AllSourcesLink asButton />
      </Group>
      <Tabs defaultValue="mine">
        <Tabs.List>
          {TABS.map(({ id, title, icon }) => (
            <Tabs.Tab key={id} value={id} leftSection={icon}>
              {title}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {TABS.map(({ id, content }) => (
          <Tabs.Panel key={id} value={id} pt="lg">
            {content}
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  );
}

export default HomeTabsPage;
