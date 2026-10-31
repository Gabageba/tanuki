import { Button, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DownloadSimpleIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalFrame from '../../components/ModalFrame';
import { isReplacing } from '../lib';
import {
  ADVICE_VIEW,
  DEFAULT_RESTORE_CHOICES,
  DEFAULT_SUMMARY_LAYOUT,
  HEADER_VIEW,
  type BackupPreview,
  type RestoreChoices,
  type SummaryLayout,
} from '../models';
import NothingNewNote from './NothingNewNote';
import RestoreAdvice from './RestoreAdvice';
import RestoreQuestions from './RestoreQuestions';
import SummaryCounters from './SummaryCounters';
import SummaryHeader from './SummaryHeader';

type Props = {
  preview: BackupPreview;
  /** Варианты осей; чего нет — по умолчанию (H1 + S1 + Q1a + W1 + T1). */
  layout?: Partial<SummaryLayout>;
  initialChoices?: Partial<RestoreChoices>;
  isPhone?: boolean;
};

/** Шаг «Сводка», живой: выбор, который что-то заменяет, сразу переводит тон в `warning` и
 *  показывает совет скачать текущую копию. */
function SummaryModal({ preview, layout, initialChoices, isPhone = false }: Props) {
  const { header, counters, question, advice, withBack } = {
    ...DEFAULT_SUMMARY_LAYOUT,
    ...layout,
  };
  const form = useForm<RestoreChoices>({
    initialValues: { ...DEFAULT_RESTORE_CHOICES, ...initialChoices },
  });
  const isWarning = isReplacing(preview, form.values);

  return (
    <ModalFrame
      isPhone={isPhone}
      tone={isWarning ? MODAL_TONE.WARNING : MODAL_TONE.NEUTRAL}
      icon={UploadSimpleIcon}
      onBack={withBack ? () => {} : undefined}
      title={
        header === HEADER_VIEW.TITLE ? `Копия от ${preview.exportedAt}` : 'Восстановить из копии'
      }
    >
      <form onSubmit={form.onSubmit(() => {})}>
        <Stack gap="md">
          <SummaryHeader view={header} preview={preview} withBack={withBack} />
          <NothingNewNote preview={preview} />
          <SummaryCounters view={counters} preview={preview} />
          <RestoreQuestions view={question} preview={preview} form={form} />
          {isWarning && <RestoreAdvice view={advice} />}
          <ModalButtonsLayout>
            {isWarning && advice === ADVICE_VIEW.BUTTON && (
              <Button variant="default" leftSection={<DownloadSimpleIcon />} mr="auto">
                Скачать текущую копию
              </Button>
            )}
            <Button variant="default">Отмена</Button>
            <Button type="submit" leftSection={<UploadSimpleIcon />}>
              Восстановить
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ModalFrame>
  );
}

export default SummaryModal;
