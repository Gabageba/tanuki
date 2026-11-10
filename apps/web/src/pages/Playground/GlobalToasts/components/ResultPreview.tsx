import { Stack, Title } from '@mantine/core';
import { ERROR, RESTORE, RESULT_TEXT_SAMPLES, UPDATE } from '../mocks';
import { RESULT_STACK_GAP, RESULT_TOAST_WIDTH, type ToastAppearance } from '../models';
import AppearancePreview from './AppearancePreview';
import OverlayDemo from './OverlayDemo';
import QueueDemo from './QueueDemo';

const INITIAL_SAMPLES = [ERROR, RESTORE, UPDATE];

type Props = {
  appearance: Partial<ToastAppearance>;
  galleryLabel: string;
  modalLabel: string;
  drawerLabel: string;
};

function ResultPreview({ appearance, galleryLabel, modalLabel, drawerLabel }: Props) {
  return (
    <Stack gap="lg">
      <Stack gap="md" role="region" aria-label={galleryLabel}>
        <Title order={4} fz={20}>
          Все тосты
        </Title>
        <AppearancePreview
          appearance={appearance}
          width={RESULT_TOAST_WIDTH}
          samples={RESULT_TEXT_SAMPLES}
        />
      </Stack>
      <Title order={4} fz={20}>
        Общий стек и очередь
      </Title>
      <QueueDemo
        appearance={appearance}
        toastWidth={RESULT_TOAST_WIDTH}
        gap={RESULT_STACK_GAP}
        initialSamples={INITIAL_SAMPLES}
        showDesktop
      />
      <OverlayDemo
        appearance={appearance}
        toastWidth={RESULT_TOAST_WIDTH}
        modalLabel={modalLabel}
        drawerLabel={drawerLabel}
      />
    </Stack>
  );
}

export default ResultPreview;
