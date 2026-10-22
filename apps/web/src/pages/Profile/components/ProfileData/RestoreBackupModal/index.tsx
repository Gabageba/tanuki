import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { CheckCircleIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import type { Backup, BackupPreview, BackupRestoreResult } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import BackupDoneStep from './BackupDoneStep';
import BackupFileStep from './BackupFileStep';
import BackupQuestionsStep from './BackupQuestionsStep';
import BackupSummaryStep from './BackupSummaryStep';
import useBackupPreview from './hooks/useBackupPreview';
import useRestoreBackup from './hooks/useRestoreBackup';
import {
  DEFAULT_RESTORE_CHOICES,
  RESTORE_STEP,
  type RestoreChoices,
  type RestoreStep,
} from './models';

type Props = {
  opened: boolean;
  onClose: () => void;
};

/**
 * Восстановление из резервной копии: файл → сводка → вопросы (только при конфликтах) → готово.
 * До «Восстановить» ничего не пишется — закрыть можно на любом шаге. Ошибки сервера показывает
 * глобальный обработчик, шаг при этом не меняется.
 */
function RestoreBackupModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<RestoreStep>(RESTORE_STEP.FILE);
  const [backup, setBackup] = useState<Backup | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [result, setResult] = useState<BackupRestoreResult | null>(null);
  const choices = useForm<RestoreChoices>({ initialValues: DEFAULT_RESTORE_CHOICES });
  const previewMutation = useBackupPreview();
  const restoreMutation = useRestoreBackup();
  const isDone = step === RESTORE_STEP.DONE;

  const handleFile = (file: Backup) =>
    previewMutation.mutate(file, {
      onSuccess: (data) => {
        setBackup(file);
        setPreview(data);
        choices.reset();
        setStep(RESTORE_STEP.SUMMARY);
      },
    });

  const handleRestore = (values: RestoreChoices) => {
    if (!backup) return;
    restoreMutation.mutate(
      { backup, ...values },
      {
        onSuccess: (data) => {
          setResult(data);
          setStep(RESTORE_STEP.DONE);
        },
      },
    );
  };

  const handleOpenBookmarks = () => {
    handleClose();
    void navigate(ROUTE_PATHS.BOOKMARKS);
  };

  const getBack = () => {
    switch (step) {
      case RESTORE_STEP.SUMMARY:
        return () => setStep(RESTORE_STEP.FILE);
      case RESTORE_STEP.QUESTIONS:
        return () => setStep(RESTORE_STEP.SUMMARY);
      case RESTORE_STEP.FILE:
      case RESTORE_STEP.DONE:
        return undefined;
    }
  };

  // Сброс мутаций отцепляет их `onSuccess` сразу при закрытии: ответ, пришедший позже, шаг уже
  // не переключит.
  const handleClose = () => {
    previewMutation.reset();
    restoreMutation.reset();
    onClose();
  };

  // Всё сбрасывается после анимации закрытия, иначе в закрывающейся модалке мелькает первый шаг.
  const reset = () => {
    setStep(RESTORE_STEP.FILE);
    setBackup(null);
    setPreview(null);
    setResult(null);
    choices.reset();
  };

  return (
    <ToneModal
      tone={isDone ? MODAL_TONE.SUCCESS : MODAL_TONE.NEUTRAL}
      icon={isDone ? CheckCircleIcon : UploadSimpleIcon}
      opened={opened}
      onClose={handleClose}
      onExitTransitionEnd={reset}
      title={isDone ? t('libraryRestored') : t('restoreFromBackup')}
      onBack={getBack()}
    >
      {step === RESTORE_STEP.FILE && (
        <BackupFileStep
          isPending={previewMutation.isPending}
          onSubmit={handleFile}
          onCancel={handleClose}
        />
      )}
      {step === RESTORE_STEP.SUMMARY && preview && (
        <BackupSummaryStep
          preview={preview}
          form={choices}
          isRestoring={restoreMutation.isPending}
          onNext={() => setStep(RESTORE_STEP.QUESTIONS)}
          onRestore={handleRestore}
          onCancel={handleClose}
        />
      )}
      {step === RESTORE_STEP.QUESTIONS && preview && (
        <BackupQuestionsStep
          preview={preview}
          form={choices}
          isRestoring={restoreMutation.isPending}
          onRestore={handleRestore}
          onCancel={handleClose}
        />
      )}
      {isDone && result && (
        <BackupDoneStep
          result={result}
          onClose={handleClose}
          onOpenBookmarks={handleOpenBookmarks}
        />
      )}
    </ToneModal>
  );
}

export default RestoreBackupModal;
