import { Button, FileInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, FileIcon } from '@phosphor-icons/react';
import { BACKUP_MAX_BYTES, type Backup } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { getBackupFileErrorLabel, parseBackupFile } from './lib';

type Props = {
  /** Сервер считает сводку — в кнопке `Loader`, как и пока файл читается. */
  isPending: boolean;
  onSubmit: (backup: Backup) => void;
  onCancel: () => void;
};

type FormValues = {
  file: File | null;
};

const BACKUP_MAX_MEGABYTES = BACKUP_MAX_BYTES / 1024 / 1024;

/** Шаг «Файл»: что это за файл и поле. Файл читается и проверяется схемой до отправки на сервер —
 *  чужой JSON дальше этого шага не уходит. */
function BackupFileStep({ isPending, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const form = useForm<FormValues>({
    initialValues: { file: null },
    validate: {
      file: (file) => {
        if (!file) return t('chooseCopyFile');
        if (file.size > BACKUP_MAX_BYTES) {
          return t('fileLargerThanMegabytes', { size: BACKUP_MAX_MEGABYTES });
        }
        return null;
      },
    },
  });

  const handleSubmit = async ({ file }: FormValues) => {
    if (!file) return;
    const parsed = await parseBackupFile(file);
    if (parsed.error) {
      form.setFieldError('file', getBackupFileErrorLabel(parsed.error, t));
      return;
    }
    onSubmit(parsed.backup);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Stack gap={6}>
          <Text lh="tight" fz="sm">
            {t('chooseBackupFile')}
          </Text>
          <Text lh="tight" c="dimmed" fz={13}>
            {t('backupComesFromDownloadButton')}
          </Text>
        </Stack>
        <FileInput
          placeholder={t('backupFile')}
          accept="application/json,.json"
          leftSection={<FileIcon />}
          clearable
          {...form.getInputProps('file')}
        />
        <ModalButtonsLayout>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            leftSection={<ArrowRightIcon />}
            // Сначала браузер читает и проверяет файл (до 20 МБ), потом сервер считает сводку.
            loading={form.submitting || isPending}
          >
            {t('next')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default BackupFileStep;
