import { Box, Stack, Text } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';

type Props = {
  title: Title;
  caption: string;
};

function ComparisonTitle({ title, caption }: Props) {
  return (
    <Stack gap={8} miw={0}>
      <Text fz="sm" c="dimmed">
        {caption}
      </Text>
      <Box w={170} maw="100%">
        <SourceTitleCard title={title} showSource />
      </Box>
    </Stack>
  );
}

export default ComparisonTitle;
