import { Stack } from '@mantine/core';
import { DOWNLOADED_LAYOUT, type DownloadedLayout } from '../models';
import DownloadedAccordion from './DownloadedAccordion';
import DownloadedGrid from './DownloadedGrid';
import DownloadedHeader from './DownloadedHeader';
import DownloadedMasterDetail from './DownloadedMasterDetail';

type Props = {
  layout: DownloadedLayout;
};

/** Блок «Скачанное»: шапка с общим объёмом и тайтлы в раскладке оси L. */
function DownloadedBlock({ layout }: Props) {
  return (
    <Stack gap="sm">
      <DownloadedHeader />
      {(layout === DOWNLOADED_LAYOUT.ACCORDION || layout === DOWNLOADED_LAYOUT.TABS) && (
        <DownloadedAccordion />
      )}
      {layout === DOWNLOADED_LAYOUT.GRID && <DownloadedGrid />}
      {layout === DOWNLOADED_LAYOUT.MASTER_DETAIL && <DownloadedMasterDetail />}
    </Stack>
  );
}

export default DownloadedBlock;
