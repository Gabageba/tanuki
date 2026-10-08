import { useState } from 'react';
import { Badge, Button, Checkbox, Divider, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { UploadSimpleIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { getBuiltInBookmarkFolderLabel } from '@/entities/bookmark/lib';
import { MOCK_IMPORT_TITLES } from './models';

type Props = {
  onClose: () => void;
};

const ALL_IDS = MOCK_IMPORT_TITLES.map(({ id }) => id);

/**
 * Последний шаг импорта: что из найденного на источнике забрать в закладки. Заглушка: список —
 * макет, а «Импорт» ничего не сохраняет.
 */
function ImportTitlesStep({ onClose }: Props) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState(ALL_IDS);
  const isAllSelected = selectedIds.length === ALL_IDS.length;

  const handleImport = () => {
    notifications.show({ message: t('willBeAvailableSoon') });
    onClose();
  };

  return (
    <Stack>
      <Checkbox
        label={t('selectedCountOfTotal', { count: selectedIds.length, total: ALL_IDS.length })}
        checked={isAllSelected}
        indeterminate={selectedIds.length > 0 && !isAllSelected}
        onChange={() => setSelectedIds(isAllSelected ? [] : ALL_IDS)}
      />
      <Divider />
      <Checkbox.Group value={selectedIds} onChange={setSelectedIds}>
        <Stack gap="sm">
          {MOCK_IMPORT_TITLES.map(({ id, name, status, isInBookmarks }) => (
            <Group key={id} justify="space-between" wrap="nowrap" align="flex-start">
              <Checkbox
                value={id}
                label={name}
                description={isInBookmarks ? t('alreadyInBookmarksWillBeAddedAsSource') : null}
              />
              <Badge variant="default" size="sm" flex="none">
                {getBuiltInBookmarkFolderLabel(status, t)}
              </Badge>
            </Group>
          ))}
        </Stack>
      </Checkbox.Group>
      <Divider />
      <Text fz={13} c="dimmed">
        {t('importDoesNotOverwriteProgress')}
      </Text>
      <ModalButtonsLayout>
        <Button variant="default" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button
          leftSection={<UploadSimpleIcon />}
          disabled={selectedIds.length === 0}
          onClick={handleImport}
        >
          {t('import')}
        </Button>
      </ModalButtonsLayout>
    </Stack>
  );
}

export default ImportTitlesStep;
