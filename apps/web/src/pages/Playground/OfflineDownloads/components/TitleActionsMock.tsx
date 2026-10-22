import type { ReactNode } from 'react';
import { ActionIcon, Button, Group, Menu, Select, Stack } from '@mantine/core';
import { BookOpenIcon, DotsThreeIcon, FolderIcon, ShareNetworkIcon } from '@phosphor-icons/react';

type Props = {
  /** B2 — кнопка состояния в ряду с папкой. */
  rowButton?: ReactNode;
  /** Плашка под кнопками. */
  children?: ReactNode;
};

/** Колонка действий под обложкой тайтла: «Продолжить», папка закладки, «…» (в нём остаётся одно
 *  «Поделиться») и место под плашку. */
function TitleActionsMock({ rowButton, children }: Props) {
  return (
    <Stack gap={8} w={280} maw="100%">
      <Button fullWidth leftSection={<BookOpenIcon />}>
        Продолжить · Гл.&nbsp;83
      </Button>
      <Group gap={8} wrap="nowrap">
        <Select
          flex={1}
          aria-label="Папка закладки"
          leftSection={<FolderIcon />}
          data={['Читаю', 'В планах', 'Прочитано']}
          defaultValue="Читаю"
          allowDeselect={false}
        />
        {rowButton}
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon size={36} variant="default" aria-label="Ещё">
              <DotsThreeIcon />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<ShareNetworkIcon />}>Поделиться</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      {children}
    </Stack>
  );
}

export default TitleActionsMock;
