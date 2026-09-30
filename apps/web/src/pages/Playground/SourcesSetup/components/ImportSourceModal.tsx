import { Button, Loader, Modal, Radio, Stack, Text } from '@mantine/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { DEMO_FAMILIES, type DemoFamilyKey } from '../models';
import ImportSourceOption from './ImportSourceOption';

type Props = {
  opened: boolean;
  isParsing: boolean;
  family: DemoFamilyKey;
  onFamilyChange: (family: DemoFamilyKey) => void;
  onSubmit: () => void;
  onClose: () => void;
};

/** Первая модалка импорта: с какого источника забрать закладки; она же ждёт, пока их читают. */
function ImportSourceModal({
  opened,
  isParsing,
  family,
  onFamilyChange,
  onSubmit,
  onClose,
}: Props) {
  const title = DEMO_FAMILIES.find(({ key }) => key === family)?.title;

  return (
    <Modal opened={opened} onClose={onClose} title="Импорт из источника" centered>
      {isParsing ? (
        <Stack align="center" gap="sm" py="lg">
          <Loader />
          <Text fw={500}>Читаем закладки на {title}</Text>
          <Text fz={13} c="dimmed" ta="center">
            Проходим по всем сайтам сети — это может занять до минуты.
          </Text>
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
        </Stack>
      ) : (
        <Stack>
          <Text fz={13} c="dimmed">
            Импорт доступен там, где выполнен вход. Дальше можно будет выбрать, какие тайтлы
            забрать.
          </Text>
          <Radio.Group value={family} onChange={(value) => onFamilyChange(value as DemoFamilyKey)}>
            <Stack gap="sm">
              {DEMO_FAMILIES.map((item) => (
                <ImportSourceOption key={item.key} family={item} />
              ))}
            </Stack>
          </Radio.Group>
          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button leftSection={<MagnifyingGlassIcon />} onClick={onSubmit}>
              Найти закладки
            </Button>
          </ModalButtonsLayout>
        </Stack>
      )}
    </Modal>
  );
}

export default ImportSourceModal;
