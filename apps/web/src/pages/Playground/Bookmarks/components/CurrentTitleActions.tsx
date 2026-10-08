import { ActionIcon, Button, Center, Group, Select, Stack } from '@mantine/core';
import { BookmarkSimpleIcon, DotsThreeIcon, PlayIcon } from '@phosphor-icons/react';

/** S0 — заглушка со страницы тайтла как есть: один пункт «Читаю» терракотой, ничего не делает. */
function CurrentTitleActions() {
  return (
    <Stack gap={8} w={280} maw="100%">
      <Button leftSection={<PlayIcon weight="fill" />}>Продолжить</Button>
      <Group gap={8} wrap="nowrap">
        <Select
          flex={1}
          data={['Читаю']}
          value="Читаю"
          c="terracotta"
          leftSection={
            <Center c="terracotta">
              <BookmarkSimpleIcon weight="fill" size={14} />
            </Center>
          }
        />
        <ActionIcon size={36} variant="default" aria-label="Ещё">
          <DotsThreeIcon />
        </ActionIcon>
      </Group>
    </Stack>
  );
}

export default CurrentTitleActions;
