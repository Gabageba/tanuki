import { useState } from 'react';
import { Badge, Button, Checkbox, Divider, Group, Modal, Stack, Text } from '@mantine/core';
import { CaretLeftIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { DEMO_IMPORT_TITLES } from '../models';

type Props = {
  opened: boolean;
  familyTitle: string;
  onBack: () => void;
  onClose: () => void;
};

const ALL_IDS = DEMO_IMPORT_TITLES.map(({ id }) => id);

/** Вторая модалка импорта: что из найденного на источнике забрать в закладки. */
function ImportTitlesModal({ opened, familyTitle, onBack, onClose }: Props) {
  const [selectedIds, setSelectedIds] = useState(ALL_IDS);
  const isAllSelected = selectedIds.length === ALL_IDS.length;

  return (
    <Modal opened={opened} onClose={onClose} title={`Закладки на ${familyTitle}`} centered>
      <Stack>
        <Checkbox
          label={`Выбрано ${selectedIds.length} из ${ALL_IDS.length}`}
          checked={isAllSelected}
          indeterminate={selectedIds.length > 0 && !isAllSelected}
          onChange={() => setSelectedIds(isAllSelected ? [] : ALL_IDS)}
        />
        <Divider />
        <Checkbox.Group value={selectedIds} onChange={setSelectedIds}>
          <Stack gap="sm">
            {DEMO_IMPORT_TITLES.map(({ id, title, status, isInBookmarks }) => (
              <Group key={id} justify="space-between" wrap="nowrap" align="flex-start">
                <Checkbox
                  value={id}
                  label={title}
                  description={
                    isInBookmarks ? 'Уже в закладках — добавится как ещё один источник' : null
                  }
                />
                <Badge variant="default" size="sm" flex="none">
                  {status}
                </Badge>
              </Group>
            ))}
          </Stack>
        </Checkbox.Group>
        <Text fz={13} c="dimmed">
          Импорт не перезаписывает прогресс, который уже есть в tanuki.
        </Text>
        <ModalButtonsLayout>
          <Button variant="default" leftSection={<CaretLeftIcon />} onClick={onBack} mr="auto">
            Другой источник
          </Button>
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button
            leftSection={<DownloadSimpleIcon />}
            disabled={selectedIds.length === 0}
            onClick={onClose}
          >
            Импортировать
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </Modal>
  );
}

export default ImportTitlesModal;
