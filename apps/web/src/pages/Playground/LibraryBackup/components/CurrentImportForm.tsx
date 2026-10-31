import { Button, FileInput, Stack, Text } from '@mantine/core';
import { FileIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ProgressList from '@/shared/ui/ProgressList';

type Props = {
  file: File | null;
};

/** Копия `MOCK_IMPORT_PREVIEW` — оригинал удаляется вместе с заглушкой. */
const CURRENT_PREVIEW = [
  { key: 'planned', label: 'В планах', count: 90 },
  { key: 'completed', label: 'Прочитано', count: 38 },
  { key: 'reading', label: 'Читаю', count: 12 },
  { key: 'dropped', label: 'Брошено', count: 8 },
];

/** F0 и S0 — нынешняя заглушка `ImportModal`: файл не читается, после выбора — макет того, что
 *  нашлось бы в нём. */
function CurrentImportForm({ file }: Props) {
  return (
    <Stack>
      <Text fz={13} c="dimmed">
        Импорт не перезаписывает прогресс — только добавляет тайтлы в закладки
      </Text>
      <FileInput
        placeholder="tanuki-export.json"
        accept="application/json,.json"
        leftSection={<FileIcon />}
        value={file}
        clearable
      />
      {file && (
        <Stack gap="sm">
          <Text fw={500}>Найдено 148 тайтлов</Text>
          <ProgressList
            gap="xs"
            items={CURRENT_PREVIEW.map(({ key, label, count }) => ({
              key,
              label,
              value: count,
              text: (
                <Text ff="monospace" fz="sm">
                  {count}
                </Text>
              ),
            }))}
          />
        </Stack>
      )}
      <ModalButtonsLayout>
        <Button variant="default">Отмена</Button>
        <Button leftSection={<UploadSimpleIcon />} disabled={!file}>
          Импорт
        </Button>
      </ModalButtonsLayout>
    </Stack>
  );
}

export default CurrentImportForm;
