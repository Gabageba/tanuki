import type { ReactNode } from 'react';
import { Badge, Box, Stack } from '@mantine/core';

type Props = {
  children: ReactNode;
};

/** Обвязка макета, которой в приложении не будет (кнопки-триггеры, «вернуть как было»): пунктир и
 *  пометка «Только песочница» — всё без неё на странице показано так, как пойдёт в реализацию. */
function SandboxOnly({ children }: Props) {
  return (
    <Stack gap={4} w="fit-content" maw="100%">
      <Badge variant="outline" color="yellow" size="xs" ff="monospace">
        Только песочница
      </Badge>
      <Box
        p="xs"
        style={{
          border: '1px dashed var(--mantine-color-yellow-outline)',
          borderRadius: 'var(--mantine-radius-md)',
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}

export default SandboxOnly;
