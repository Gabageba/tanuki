import { Button, List, Stack, Text } from '@mantine/core';
import { ArrowLeftIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MARK_FORMS, TITLE_FORMS, formatCountWord, hasFolderConflict, pluralize } from '../lib';
import { FOLDER_POLICY, PROGRESS_POLICY, type BackupPreview, type RestoreChoices } from '../models';

type Props = {
  preview: BackupPreview;
  choices: RestoreChoices;
  onBack: () => void;
  onConfirm: () => void;
};

/** Что из выбранного заменит существующее. */
const getReplacements = (preview: BackupPreview, choices: RestoreChoices) => {
  const { otherFolder } = preview.bookmarks;
  const { differs, furtherInBackup } = preview.progress;
  const getProgressLine = () => {
    switch (choices.progressPolicy) {
      case PROGRESS_POLICY.FURTHEST:
        return (
          furtherInBackup > 0 &&
          `${formatCountWord(furtherInBackup, MARK_FORMS)} «где остановился» ${pluralize(furtherInBackup, { one: 'сдвинется', few: 'сдвинутся', many: 'сдвинутся' })} вперёд`
        );
      case PROGRESS_POLICY.KEEP_MINE:
        return false;
      case PROGRESS_POLICY.FROM_BACKUP:
        return (
          differs > 0 &&
          `${formatCountWord(differs, MARK_FORMS)} «где остановился» ${pluralize(differs, { one: 'заменится', few: 'заменятся', many: 'заменятся' })} отметками из копии`
        );
    }
  };

  return [
    hasFolderConflict(preview) &&
      choices.folderPolicy === FOLDER_POLICY.FROM_BACKUP &&
      `${formatCountWord(otherFolder, TITLE_FORMS)} ${pluralize(otherFolder, { one: 'переедет', few: 'переедут', many: 'переедут' })} в папки из копии`,
    getProgressLine(),
    choices.applySettings && 'Общие настройки, читалка и источники заменятся настройками из копии',
  ].filter(Boolean);
};

/** Предупреждение после «Восстановить», когда выбор что-то заменяет. Тон warning — поэтому
 *  назад ведёт кнопка, а не стрелка: стрелка встала бы на место иконки тона. */
function ConfirmStep({ preview, choices, onBack, onConfirm }: Props) {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text fz="sm">Восстановление заменит часть вашей библиотеки:</Text>
        <List fz="sm" spacing={4}>
          {getReplacements(preview, choices).map((line) => (
            <List.Item key={String(line)}>{line}</List.Item>
          ))}
        </List>
        <Text c="dimmed" fz={13}>
          Это нельзя отменить. Остальное из копии только добавится.
        </Text>
      </Stack>
      <ModalButtonsLayout>
        <Button variant="default" leftSection={<ArrowLeftIcon />} onClick={onBack}>
          Назад
        </Button>
        <Button leftSection={<UploadSimpleIcon />} onClick={onConfirm}>
          Восстановить
        </Button>
      </ModalButtonsLayout>
    </Stack>
  );
}

export default ConfirmStep;
