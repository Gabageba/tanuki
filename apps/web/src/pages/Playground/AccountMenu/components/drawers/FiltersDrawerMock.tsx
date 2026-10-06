import { ActionIcon, Checkbox, Group, Stack, Text } from '@mantine/core';
import { CaretLeftIcon, CaretRightIcon, FunnelIcon } from '@phosphor-icons/react';
import DrawerPanel from '../DrawerPanel';
import DrawerHeading from '../DrawerHeading';
import HeadingIcon from '../HeadingIcon';
import { HEADER_STYLE, type HeaderStyle } from '../../models';

type Props = {
  headerStyle: HeaderStyle;
  /** Внутренний шаг — открыта группа «Жанры». */
  isInner?: boolean;
};

const GROUPS = [
  { title: 'Жанры', count: 2 },
  { title: 'Теги', count: 1 },
  { title: 'Статус', count: 0 },
];

function FiltersDrawerMock({ headerStyle, isInner = false }: Props) {
  const backButton = (
    <ActionIcon
      size={headerStyle === HEADER_STYLE.UNIFORM ? 40 : undefined}
      radius="md"
      variant={headerStyle === HEADER_STYLE.UNIFORM ? 'light' : 'subtle'}
      color="gray"
      flex="none"
    >
      <CaretLeftIcon size={headerStyle === HEADER_STYLE.UNIFORM ? 20 : undefined} />
    </ActionIcon>
  );

  let title;
  if (headerStyle === HEADER_STYLE.UNIFORM) {
    title = (
      <DrawerHeading
        icon={
          isInner ? (
            backButton
          ) : (
            <HeadingIcon>
              <FunnelIcon size={20} />
            </HeadingIcon>
          )
        }
        title={isInner ? 'Жанры' : 'Все фильтры'}
        subtitle={isInner ? 'Выбрано 2' : 'Выбрано 3'}
      />
    );
  } else if (isInner) {
    title = (
      <Group gap={4} wrap="nowrap">
        {backButton}
        <Text fw={600} fz="md" lh={1}>
          Жанры
        </Text>
        <Text fz="xs" c="dimmed" ff="monospace" ml="xs">
          2
        </Text>
      </Group>
    );
  } else {
    title = 'Все фильтры';
  }

  return (
    <DrawerPanel title={title}>
      {isInner ? (
        <Stack gap="sm">
          <Checkbox label="Боевик" defaultChecked />
          <Checkbox label="Драма" defaultChecked />
          <Checkbox label="Комедия" />
        </Stack>
      ) : (
        <Stack gap={4}>
          {GROUPS.map((group) => (
            <Group key={group.title} justify="space-between" px="sm" py={8} wrap="nowrap">
              <Text fz="sm">{group.title}</Text>
              <Group gap={6} wrap="nowrap">
                {group.count > 0 && (
                  <Text fz="xs" ff="monospace" c="dimmed">
                    {group.count}
                  </Text>
                )}
                <CaretRightIcon size={14} color="var(--mantine-color-dimmed)" />
              </Group>
            </Group>
          ))}
        </Stack>
      )}
    </DrawerPanel>
  );
}

export default FiltersDrawerMock;
