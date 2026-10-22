import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { UNAVAILABLE_PLACE } from '../models';
import OfflineUnavailable from './OfflineUnavailable';
import ReaderEndMock from './ReaderEndMock';

type Props = {
  withDownloadsLink: boolean;
};

/** Три места без сети рядом: страница тайтла, читалка и конец главы. */
function UnavailableTrio({ withDownloadsLink }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" maw={1240}>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Страница тайтла
        </Text>
        <Paper withBorder radius="md" p="md" h="100%">
          <OfflineUnavailable
            place={UNAVAILABLE_PLACE.TITLE}
            withDownloadsLink={withDownloadsLink}
          />
        </Paper>
      </Stack>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Читалка
        </Text>
        <Paper withBorder radius="md" p="md" h="100%">
          <OfflineUnavailable
            place={UNAVAILABLE_PLACE.CHAPTER}
            withDownloadsLink={withDownloadsLink}
          />
        </Paper>
      </Stack>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Конец главы
        </Text>
        <Paper withBorder radius="md" style={{ overflow: 'hidden' }} h="100%">
          <ReaderEndMock withDownloadsLink={withDownloadsLink} />
        </Paper>
      </Stack>
    </SimpleGrid>
  );
}

export default UnavailableTrio;
