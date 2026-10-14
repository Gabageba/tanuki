import { Group, Stack, Text } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import CardsScroller from '../../TitleSearch/components/CardsScroller';
import { DISCOVER_PATH, HOME_REMANGA } from '../mocks';
import HomeBlockHeading from './HomeBlockHeading';

/** Превью подборок — одна лента из источника, который последним открывали на странице подборок,
 *  подписанная источником и блоком; ведёт туда. */
function SelectionsPreview() {
  const { source, blocks } = HOME_REMANGA;
  const block = blocks[0];

  if (!block) {
    return null;
  }

  return (
    <Stack gap="sm">
      <HomeBlockHeading
        title="Из подборок"
        link={{ label: 'Открыть подборки', to: `${DISCOVER_PATH}/${source.id}` }}
      />
      <Group gap={6} wrap="nowrap" mt={-4}>
        <SourceIcon id={source.id} title={source.title} size={18} />
        <Text fz="sm" c="dimmed">
          {source.title} · {block.title}
        </Text>
      </Group>
      <CardsScroller items={block.items} />
    </Stack>
  );
}

export default SelectionsPreview;
