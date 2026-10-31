import { Radio, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { RESTORE_FOLDER_POLICY, RESTORE_PROGRESS_POLICY } from '@tanuki/contracts';
import RadioCardOption from '@/shared/ui/RadioCardOption';
import {
  getTakeFoldersDescription,
  getTakeFoldersLabel,
  getTakeProgressDescription,
  getTakeProgressLabel,
} from './lib';
import type { MergeChoices, MergeOrigin } from './models';

type Props<Values extends MergeChoices> = {
  origin: MergeOrigin;
  /** Сколько тайтлов уже в закладках, но в другой папке; 0 — вопроса нет. */
  otherFolder: number;
  /** Сколько отметок «где остановился» расходятся с вашими; 0 — вопроса нет. */
  progressDiffers: number;
  /** Форма шага: в ней могут быть и другие поля (флажок настроек у копии). */
  form: UseFormReturnType<Values>;
};

/**
 * Вопросы о конфликтах чужой библиотеки с вашей — у восстановления из копии и импорта из
 * источника: число в заголовке, у ответов — правило. Вопрос без конфликтов не показывается.
 */
function MergeQuestions<Values extends MergeChoices>({
  origin,
  otherFolder,
  progressDiffers,
  form,
}: Props<Values>) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      {otherFolder > 0 && (
        <Stack gap="xs">
          <Text lh="tight" fz="sm" fw={500}>
            {t('titlesInBookmarksInOtherFolder', { count: otherFolder })}
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
                title={getTakeFoldersLabel(origin, t)}
                description={getTakeFoldersDescription(origin, t)}
              />
            </Stack>
          </Radio.Group>
        </Stack>
      )}
      {progressDiffers > 0 && (
        <Stack gap="xs">
          <Text lh="tight" fz="sm" fw={500}>
            {t('whereLeftOffMarksDiffer', { count: progressDiffers })}
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
                title={getTakeProgressLabel(origin, t)}
                description={getTakeProgressDescription(origin, t)}
              />
            </Stack>
          </Radio.Group>
        </Stack>
      )}
    </Stack>
  );
}

export default MergeQuestions;
