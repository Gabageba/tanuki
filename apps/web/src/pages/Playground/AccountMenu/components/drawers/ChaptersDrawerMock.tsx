import { Group, Stack, Text } from '@mantine/core';
import { ListNumbersIcon } from '@phosphor-icons/react';
import DrawerPanel from '../DrawerPanel';
import DrawerHeading from '../DrawerHeading';
import HeadingIcon from '../HeadingIcon';
import { HEADER_STYLE, type HeaderStyle } from '../../models';

type Props = {
  headerStyle: HeaderStyle;
};

const CHAPTERS = [
  { number: 120, title: 'Возвращение' },
  { number: 119, title: 'Перед бурей' },
  { number: 118, title: 'Старый долг' },
];

function ChaptersDrawerMock({ headerStyle }: Props) {
  return (
    <DrawerPanel
      title={
        headerStyle === HEADER_STYLE.UNIFORM ? (
          <DrawerHeading
            icon={
              <HeadingIcon>
                <ListNumbersIcon size={20} />
              </HeadingIcon>
            }
            title="Главы"
            subtitle="Открыта гл. 34 из 120"
          />
        ) : (
          <Group gap={8} align="flex-end">
            <Text fw={600} fz="md" lh={1}>
              Главы
            </Text>
            <Text fz={13} lh="tight" c="dimmed">
              120
            </Text>
          </Group>
        )
      }
    >
      <Stack gap={4}>
        {CHAPTERS.map((chapter) => (
          <Group key={chapter.number} gap="sm" px="sm" py={8} wrap="nowrap">
            <Text fz="sm" ff="monospace" c="dimmed" w={32}>
              {chapter.number}
            </Text>
            <Text fz="sm" truncate>
              {chapter.title}
            </Text>
          </Group>
        ))}
      </Stack>
    </DrawerPanel>
  );
}

export default ChaptersDrawerMock;
