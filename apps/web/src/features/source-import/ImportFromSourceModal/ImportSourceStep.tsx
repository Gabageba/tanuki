import { Button, Radio, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { Source, SourceAccount, SourceAuthFamily } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ImportSourceFamily from './ImportSourceFamily';

type Props = {
  families: { family: SourceAuthFamily; title: string; sources: Source[] }[];
  accounts: SourceAccount[];
  /** Откуда можно импортировать: есть вход и сайт отдаёт закладки. */
  importableIds: string[];
  /** Выбранный раньше (возврат с шага «Папки»). */
  initialSourceId: string | null;
  onSubmit: (sourceId: string) => void;
  onCancel: () => void;
};

type FormValues = {
  sourceId: string | null;
};

/** Первый шаг импорта: с какого источника забрать закладки. */
function ImportSourceStep({
  families,
  accounts,
  importableIds,
  initialSourceId,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  // Пока человек не выбрал сам, выбран первый источник, откуда можно импортировать; выбранный
  // раньше сбрасывается, если вход на нём пропал.
  const resolve = (value: string | null) =>
    value !== null && importableIds.includes(value) ? value : (importableIds[0] ?? null);
  const form = useForm<FormValues>({
    initialValues: { sourceId: initialSourceId },
    validate: {
      sourceId: (value) => (resolve(value) === null ? t('chooseSource') : null),
    },
  });
  const sourceId = resolve(form.getValues().sourceId);

  // `validate` уже не пропустил пустой выбор — здесь id есть всегда.
  const handleSubmit = (values: FormValues) => {
    const id = resolve(values.sourceId);
    if (id !== null) onSubmit(id);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Text fz={13} c="dimmed">
          {t('importAvailableWhereLoggedInChooseFolders')}
        </Text>
        <Radio.Group
          value={sourceId}
          onChange={(value) => form.setFieldValue('sourceId', value)}
          error={form.errors.sourceId}
        >
          <Stack gap="md">
            {families.map((item) => (
              <ImportSourceFamily
                key={item.family}
                title={item.title}
                sources={item.sources}
                account={accounts.find((account) => account.family === item.family)}
                sourceId={sourceId}
              />
            ))}
          </Stack>
        </Radio.Group>
        <ModalButtonsLayout>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="submit" leftSection={<MagnifyingGlassIcon />}>
            {t('findBookmarks')}
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default ImportSourceStep;
