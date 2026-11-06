import type { ReactNode } from 'react';
import { Paper, ScrollArea, Stack, Text } from '@mantine/core';

type Props = { phone: boolean; wide?: boolean; children: ReactNode };

function PreviewFrame({ phone, wide = false, children }: Props) {
  const width = phone ? 360 : wide ? 960 : 720;
  return (
    <Stack gap="xs" miw={0}>
      <Text fz="xs" c="dimmed">
        {phone ? 'Телефон · 360 px' : `Десктоп · ${width} px`}
      </Text>
      <ScrollArea type="auto" offsetScrollbars>
        <Paper withBorder p="sm" w={width}>
          {children}
        </Paper>
      </ScrollArea>
    </Stack>
  );
}

export default PreviewFrame;
