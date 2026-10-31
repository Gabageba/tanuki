import { Checkbox, Radio, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import {
  MARK_FORMS,
  TITLE_FORMS,
  formatCountWord,
  hasFolderConflict,
  hasProgressConflict,
  pluralize,
} from '../lib';
import {
  FOLDER_POLICY,
  PROGRESS_POLICY,
  QUESTION_VIEW,
  type BackupPreview,
  type QuestionView,
  type RestoreChoices,
} from '../models';
import PolicyCard from './PolicyCard';

type Props = {
  view: QuestionView;
  preview: BackupPreview;
  form: UseFormReturnType<RestoreChoices>;
};

/** Q — вопросы, только если есть о чём спрашивать, и флажок настроек. Q1a — число в заголовке
 *  вопроса, Q1b — у самих ответов, которые его меняют. */
function RestoreQuestions({ view, preview, form }: Props) {
  const isCountInTitle = view === QUESTION_VIEW.COUNT_IN_TITLE;
  const titles = formatCountWord(preview.bookmarks.otherFolder, TITLE_FORMS);
  const { differs, furtherInBackup } = preview.progress;
  const marks = formatCountWord(differs, MARK_FORMS);
  const differVerb = pluralize(differs, {
    one: 'расходится',
    few: 'расходятся',
    many: 'расходятся',
  });
  const furtherMarks = formatCountWord(furtherInBackup, MARK_FORMS);
  const keptMarks = formatCountWord(differs - furtherInBackup, MARK_FORMS);

  return (
    <Stack gap="md">
      {hasFolderConflict(preview) && (
        <Stack gap="xs">
          <Text fz="sm" fw={500}>
            {isCountInTitle
              ? `${titles} уже в закладках, но в другой папке`
              : 'Папки тайтлов, что уже в закладках'}
          </Text>
          <Radio.Group {...form.getInputProps('folderPolicy')}>
            <Stack gap="xs">
              <PolicyCard
                value={FOLDER_POLICY.KEEP_MINE}
                title="Оставить мои"
                description={
                  isCountInTitle ? 'Тайтлы останутся в своих папках' : 'Ничего не переедет'
                }
              />
              <PolicyCard
                value={FOLDER_POLICY.FROM_BACKUP}
                title="Взять из копии"
                description={
                  isCountInTitle
                    ? 'Тайтлы переедут в папки из копии'
                    : `${titles} ${pluralize(preview.bookmarks.otherFolder, { one: 'переедет', few: 'переедут', many: 'переедут' })} в папки из копии`
                }
              />
            </Stack>
          </Radio.Group>
        </Stack>
      )}
      {hasProgressConflict(preview) && (
        <Stack gap="xs">
          <Text fz="sm" fw={500}>
            {isCountInTitle
              ? `Где остановился: ${marks} ${differVerb} с вашими`
              : 'Где остановился'}
          </Text>
          <Radio.Group {...form.getInputProps('progressPolicy')}>
            <Stack gap="xs">
              <PolicyCard
                value={PROGRESS_POLICY.FURTHEST}
                title="Дальше прочитанное"
                description={
                  isCountInTitle
                    ? 'Из двух отметок останется та, что дальше по главам'
                    : `${furtherMarks} сдвинутся вперёд, ${keptMarks} останутся`
                }
              />
              <PolicyCard
                value={PROGRESS_POLICY.KEEP_MINE}
                title="Мой текущий"
                description={isCountInTitle ? 'Ваши отметки не изменятся' : 'Ничего не изменится'}
              />
              <PolicyCard
                value={PROGRESS_POLICY.FROM_BACKUP}
                title="Из копии"
                description={
                  isCountInTitle
                    ? 'Ваши отметки заменятся отметками из копии'
                    : `${marks} заменятся отметками из копии`
                }
              />
            </Stack>
          </Radio.Group>
        </Stack>
      )}
      <Checkbox
        label="Применить настройки из копии"
        description="Заменит общие настройки, читалку и порядок источников"
        {...form.getInputProps('applySettings', { type: 'checkbox' })}
      />
    </Stack>
  );
}

export default RestoreQuestions;
