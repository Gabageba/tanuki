import { useState } from 'react';
import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import Frames from '../../../Notifications/components/Frames';
import { IOS_HINT_LOOK, QUEUE_REORDER } from '../../models';
import DownloadsEmpty from '../DownloadsEmpty';
import DownloadsPageMock from '../DownloadsPageMock';
import DownloadsTabs from '../DownloadsTabs';
import DownloadsUnsupported from '../DownloadsUnsupported';
import IosHintAlert from '../IosHintAlert';

/** Итог «Загрузок»: блок iOS H11 до «Не сейчас», вкладки L4 с очередью Q2 и списком L1, пусто E2. */
function FinalDownloads() {
  const [isIosHintVisible, setIsIosHintVisible] = useState(true);

  return (
    <Stack gap="lg">
      <Frames>
        <DownloadsPageMock>
          {isIosHintVisible && (
            <IosHintAlert
              look={IOS_HINT_LOOK.STRIPE}
              onDismiss={() => setIsIosHintVisible(false)}
            />
          )}
          <DownloadsTabs reorder={QUEUE_REORDER.DRAG} />
        </DownloadsPageMock>
      </Frames>
      <Stack gap={6}>
        <Text fz={12} c="dimmed" ff="monospace">
          Пусто и без поддержки
        </Text>
        <SimpleGrid cols={{ base: 1, md: 2 }} maw={1100}>
          <Paper withBorder radius="md" p="md">
            <DownloadsEmpty withHowTo />
          </Paper>
          <Paper withBorder radius="md" p="md">
            <DownloadsUnsupported withHowTo />
          </Paper>
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}

export default FinalDownloads;
