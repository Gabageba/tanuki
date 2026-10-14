import { useState } from 'react';
import { Chip, Group, Scroller, Stack, Title } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getKindItems } from '../lib';
import { BLOCK_KIND_BY_ID, MOCK_CONTINUE, MOCK_HOME_ALL } from '../mocks';
import { CONTINUE_CARD, HOME_KIND, type HomeKind } from '../models';
import ContinueReading from './ContinueReading';
import HomePageTitle from './HomePageTitle';
import KindRibbon from './KindRibbon';

const KINDS: { kind: HomeKind; title: string }[] = [
  { kind: HOME_KIND.NEW, title: 'Новинки' },
  { kind: HOME_KIND.POPULAR, title: 'Популярное' },
  { kind: HOME_KIND.UPDATES, title: 'Обновления' },
];

/** P5 — подборки сведены по смыслу: три ленты со всех источников вперемешку. Чипы источников
 *  сужают все три ленты; ни один не выбран — без ограничения. */
function HomeByMeaningPage() {
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const homes =
    sourceIds.length === 0
      ? MOCK_HOME_ALL
      : MOCK_HOME_ALL.filter((home) => sourceIds.includes(home.source.id));

  return (
    <Stack gap="xl">
      <HomePageTitle />
      <ContinueReading items={MOCK_CONTINUE} card={CONTINUE_CARD.META_FIRST} />
      <Stack gap="md">
        <Title order={4}>Подборки источников</Title>
        <Scroller>
          <Chip.Group multiple value={sourceIds} onChange={setSourceIds}>
            <Group gap="xs" wrap="nowrap">
              {MOCK_HOME_ALL.map(({ source }) => (
                <Chip key={source.id} value={source.id} variant="outline" size="sm">
                  <Group gap={6} wrap="nowrap">
                    <SourceIcon id={source.id} title={source.title} size={16} />
                    {source.title}
                  </Group>
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Scroller>
        <Stack gap="lg">
          {KINDS.map(({ kind, title }) => (
            <KindRibbon
              key={kind}
              title={title}
              items={getKindItems(homes, kind, BLOCK_KIND_BY_ID)}
            />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}

export default HomeByMeaningPage;
