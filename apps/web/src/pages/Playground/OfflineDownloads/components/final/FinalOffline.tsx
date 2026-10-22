import { Box, Paper, Stack, Text } from '@mantine/core';
import Frames from '../../../Notifications/components/Frames';
import { OFFLINE_CHAPTER_ROWS } from '../../mocks';
import { CHAPTER_ICON, OFFLINE_CATALOG, OFFLINE_ROW, OFFLINE_SIGNAL } from '../../models';
import AppChromeMock from '../AppChromeMock';
import ChapterListDemo from '../ChapterListDemo';
import OfflineCatalogEmpties from '../OfflineCatalogEmpties';
import OfflineCatalogMock from '../OfflineCatalogMock';
import UnavailableTrio from '../UnavailableTrio';

/** Итог без сети: полоса N2b над каталогом без заметки, список глав D2, недоступное U1. */
function FinalOffline() {
  return (
    <Stack gap="lg">
      <Frames>
        <AppChromeMock signal={OFFLINE_SIGNAL.STRIP_LINK_GOLD}>
          <OfflineCatalogMock variant={OFFLINE_CATALOG.PLAIN} />
        </AppChromeMock>
      </Frames>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Список глав без сети
        </Text>
        <Box maw={640}>
          <ChapterListDemo
            chapters={OFFLINE_CHAPTER_ROWS}
            variant={CHAPTER_ICON.COUNTER}
            offlineRow={OFFLINE_ROW.DIMMED_ICON}
          />
        </Box>
      </Stack>
      <UnavailableTrio withDownloadsLink />
      <Paper radius="md">
        <OfflineCatalogEmpties />
      </Paper>
    </Stack>
  );
}

export default FinalOffline;
