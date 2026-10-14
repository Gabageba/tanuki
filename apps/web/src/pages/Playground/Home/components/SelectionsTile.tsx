import { AspectRatio, Box, Group } from '@mantine/core';
import { SparkleIcon } from '@phosphor-icons/react';
import CoverImage from '@/shared/ui/CoverImage';
import { DISCOVER_PATH, HOME_REMANGA } from '../mocks';
import EntryTile from './EntryTile';

/** Наклон обложек веера — по одной на каждую из трёх. */
const FAN_ROTATIONS = [-8, 0, 8];

/** V2 — плитка «Подборки» с веером из трёх обложек: ведёт на страницу подборок. */
function SelectionsTile() {
  const fan = HOME_REMANGA.blocks[0]?.items.slice(0, 3) ?? [];

  return (
    <EntryTile
      to={DISCOVER_PATH}
      icon={<SparkleIcon size={22} />}
      title="Подборки"
      description="Новинки, популярное и обновления с главных страниц сайтов"
      visual={
        <Group gap={0} wrap="nowrap" flex="none" pr="xs">
          {fan.map((title, index) => (
            <Box
              key={title.id}
              w={44}
              ml={index === 0 ? 0 : -14}
              style={{ transform: `rotate(${FAN_ROTATIONS[index] ?? 0}deg)` }}
            >
              <AspectRatio ratio={3 / 4}>
                <Box bdrs="sm" style={{ overflow: 'hidden' }}>
                  <CoverImage src={title.coverUrl} alt={title.name} />
                </Box>
              </AspectRatio>
            </Box>
          ))}
        </Group>
      }
    />
  );
}

export default SelectionsTile;
