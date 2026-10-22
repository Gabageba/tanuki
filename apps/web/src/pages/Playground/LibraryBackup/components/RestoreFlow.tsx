import { useState } from 'react';
import { Button, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ArrowRightIcon, CheckCircleIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalFrame from '../../components/ModalFrame';
import { buildRestoreResult, hasFolderConflict, hasProgressConflict, isReplacing } from '../lib';
import {
  DEFAULT_RESTORE_CHOICES,
  DONE_VIEW,
  FILE_STATE,
  FILE_VIEW,
  FLOW_SPLIT,
  HEADER_VIEW,
  QUESTION_VIEW,
  RESTORE_STEP,
  type BackupPreview,
  type FlowSplit,
  type RestoreChoices,
  type RestoreStep,
} from '../models';
import BackupFileForm from './BackupFileForm';
import ConfirmStep from './ConfirmStep';
import DoneModalBody from './DoneModalBody';
import NothingNewNote from './NothingNewNote';
import RestoreQuestions from './RestoreQuestions';
import SummaryHeader from './SummaryHeader';
import SummaryRows from './SummaryRows';

type Props = {
  split: FlowSplit;
  preview: BackupPreview;
  isPhone?: boolean;
  /** С какого шага открыть — чтобы показать шаги рядом. */
  initialStep?: RestoreStep;
  /** ★3 — без шага-предупреждения: «Восстановить» сразу пишет. */
  withConfirm?: boolean;
};

/** Итог целиком, живой: «Файл» → «Сводка» (→ «Вопросы» у ★1) → предупреждение, если выбор что-то
 *  заменяет → «Готово». На внутренних шагах — стрелка назад (T2). */
function RestoreFlow({
  split,
  preview,
  isPhone = false,
  initialStep = RESTORE_STEP.FILE,
  withConfirm = true,
}: Props) {
  const [step, setStep] = useState<RestoreStep>(initialStep);
  const form = useForm<RestoreChoices>({ initialValues: DEFAULT_RESTORE_CHOICES });
  const hasConflicts = hasFolderConflict(preview) || hasProgressConflict(preview);
  // ★1 уносит вопросы на свой шаг, но ради одного флажка настроек шаг не заводится.
  const hasQuestionsStep = split === FLOW_SPLIT.QUESTIONS_STEP && hasConflicts;
  const choicesStep = hasQuestionsStep ? RESTORE_STEP.QUESTIONS : RESTORE_STEP.SUMMARY;

  const restore = form.onSubmit((values) =>
    setStep(withConfirm && isReplacing(preview, values) ? RESTORE_STEP.CONFIRM : RESTORE_STEP.DONE),
  );

  const getBack = () => {
    switch (step) {
      case RESTORE_STEP.SUMMARY:
        return () => setStep(RESTORE_STEP.FILE);
      case RESTORE_STEP.QUESTIONS:
        return () => setStep(RESTORE_STEP.SUMMARY);
      case RESTORE_STEP.FILE:
      case RESTORE_STEP.CONFIRM:
      case RESTORE_STEP.DONE:
        return undefined;
    }
  };

  const getTone = () => {
    switch (step) {
      case RESTORE_STEP.CONFIRM:
        return MODAL_TONE.WARNING;
      case RESTORE_STEP.DONE:
        return MODAL_TONE.SUCCESS;
      case RESTORE_STEP.FILE:
      case RESTORE_STEP.SUMMARY:
      case RESTORE_STEP.QUESTIONS:
        return MODAL_TONE.NEUTRAL;
    }
  };

  const reset = () => {
    form.reset();
    setStep(initialStep);
  };

  return (
    <ModalFrame
      isPhone={isPhone}
      tone={getTone()}
      icon={step === RESTORE_STEP.DONE ? CheckCircleIcon : UploadSimpleIcon}
      onBack={getBack()}
      title={step === RESTORE_STEP.DONE ? 'Библиотека восстановлена' : 'Восстановить из копии'}
    >
      {step === RESTORE_STEP.FILE && (
        <BackupFileForm
          view={FILE_VIEW.INPUT}
          state={FILE_STATE.CHOSEN}
          onSubmit={() => setStep(RESTORE_STEP.SUMMARY)}
        />
      )}
      {step === RESTORE_STEP.SUMMARY && (
        <form
          onSubmit={
            hasQuestionsStep
              ? (event) => {
                  event.preventDefault();
                  setStep(RESTORE_STEP.QUESTIONS);
                }
              : restore
          }
        >
          <Stack gap="md">
            <SummaryHeader view={HEADER_VIEW.PHRASE} preview={preview} withBack />
            <NothingNewNote preview={preview} />
            <SummaryRows preview={preview} />
            {!hasQuestionsStep && (
              <RestoreQuestions view={QUESTION_VIEW.COUNT_IN_TITLE} preview={preview} form={form} />
            )}
            <ModalButtonsLayout>
              <Button variant="default" onClick={reset}>
                Отмена
              </Button>
              {hasQuestionsStep ? (
                <Button type="submit" leftSection={<ArrowRightIcon />}>
                  Далее
                </Button>
              ) : (
                <Button type="submit" leftSection={<UploadSimpleIcon />}>
                  Восстановить
                </Button>
              )}
            </ModalButtonsLayout>
          </Stack>
        </form>
      )}
      {step === RESTORE_STEP.QUESTIONS && (
        <form onSubmit={restore}>
          <Stack gap="md">
            <RestoreQuestions view={QUESTION_VIEW.COUNT_IN_TITLE} preview={preview} form={form} />
            <ModalButtonsLayout>
              <Button variant="default" onClick={reset}>
                Отмена
              </Button>
              <Button type="submit" leftSection={<UploadSimpleIcon />}>
                Восстановить
              </Button>
            </ModalButtonsLayout>
          </Stack>
        </form>
      )}
      {step === RESTORE_STEP.CONFIRM && (
        <ConfirmStep
          preview={preview}
          choices={form.values}
          onBack={() => setStep(choicesStep)}
          onConfirm={() => setStep(RESTORE_STEP.DONE)}
        />
      )}
      {step === RESTORE_STEP.DONE && (
        <DoneModalBody
          view={DONE_VIEW.ROWS}
          result={buildRestoreResult(preview, form.values)}
          onClose={reset}
        />
      )}
    </ModalFrame>
  );
}

export default RestoreFlow;
