import { Box, Flex, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = { desktop: ReactNode; phone: ReactNode };

function VariantFrames({ desktop, phone }: Props) {
  return (
    <Flex gap="lg" wrap="wrap" align="flex-start">
      <Stack gap={6} w={880} maw="100%" miw={0}>
        <Text fz="xs" c="dimmed">
          Десктоп · 880 px
        </Text>
        <ScrollArea type="auto" offsetScrollbars>
          <Paper withBorder radius="md" w={880} style={{ overflow: 'hidden' }}>
            {desktop}
          </Paper>
        </ScrollArea>
      </Stack>
      <Stack gap={6} w={375} maw="100%" miw={0}>
        <Text fz="xs" c="dimmed">
          Телефон · 375 px
        </Text>
        <ScrollArea type="auto" offsetScrollbars>
          <Box w={375}>
            <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
              {phone}
            </Paper>
          </Box>
        </ScrollArea>
      </Stack>
    </Flex>
  );
}

export default VariantFrames;
