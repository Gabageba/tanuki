import { Checkbox, Radio, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import {
  RESTORE_FOLDER_POLICY,
  RESTORE_PROGRESS_POLICY,
  type BackupPreview,
} from '@tanuki/contracts';
import { hasFolderConflict, hasProgressConflict } from './lib';
import RadioCardOption from '@/shared/ui/RadioCardOption';
import type { RestoreChoices } from './models';

type Props = {
  preview: BackupPreview;
  form: UseFormReturnType<RestoreChoices>;
};

/** Вопросы — только если есть о чём спрашивать: число в заголовке, у ответов — правило. Флажок
 *  настроек — всегда. */
function RestoreQuestions({ preview, form }: Props) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      {hasFolderConflict(preview) && (
        <Stack gap="xs">
          <Text lh="tight" fz="sm" fw={500}>
            {t('titlesInBookmarksInOtherFolder', { count: preview.bookmarks.otherFolder })}
          </Text>
          <Radio.Group {...form.getInputProps('folderPolicy')}>
            <Stack gap="xs">
              <RadioCardOption
                value={RESTORE_FOLDER_POLICY.KEEP_MINE}
                title={t('keepMine')}
                description={t('titlesStayInTheirFolders')}
              />
              <RadioCardOption
                value={RESTORE_FOLDER_POLICY.FROM_BACKUP}
                title={t('takeFromBackup')}
                description={t('titlesMoveToBackupFolders')}
              />
            </Stack>
          </Radio.Group>
        </Stack>
      )}
      {hasProgressConflict(preview) && (
        <Stack gap="xs">
          <Text lh="tight" fz="sm" fw={500}>
            {t('whereLeftOffMarksDiffer', { count: preview.progress.differs })}
          </Text>
          <Radio.Group {...form.getInputProps('progressPolicy')}>
            <Stack gap="xs">
              <RadioCardOption
                value={RESTORE_PROGRESS_POLICY.FURTHEST}
                title={t('furthestRead')}
                description={t('furtherOfTwoMarksStays')}
              />
              <RadioCardOption
                value={RESTORE_PROGRESS_POLICY.KEEP_MINE}
                title={t('myCurrent')}
                description={t('yourMarksWontChange')}
              />
              <RadioCardOption
                value={RESTORE_PROGRESS_POLICY.FROM_BACKUP}
                title={t('fromBackup')}
                description={t('yourMarksReplacedFromBackup')}
              />
            </Stack>
          </Radio.Group>
        </Stack>
      )}
      <Checkbox
        label={t('applySettingsFromBackup')}
        description={t('replacesGeneralReaderSourceOrder')}
        {...form.getInputProps('applySettings', { type: 'checkbox' })}
      />
    </Stack>
  );
}

export default RestoreQuestions;
