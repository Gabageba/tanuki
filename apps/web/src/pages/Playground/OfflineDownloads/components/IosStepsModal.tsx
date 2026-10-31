import { Button, List, Stack, Text } from '@mantine/core';
import { CheckIcon, DeviceMobileIcon, ExportIcon, PlusSquareIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalFrame from '../../components/ModalFrame';

/** H3 — нейтральная модалка с шагами установки в Safari. Значки в шагах — копии кнопок Safari,
 *  без них шаг не найти. */
function IosStepsModal() {
  return (
    <ModalFrame title="Установите Tanuki" tone={MODAL_TONE.NEUTRAL} icon={DeviceMobileIcon}>
      <Stack gap="md">
        <Stack gap={6}>
          <Text fz="sm">Так скачанные главы не пропадут.</Text>
          <Text c="dimmed" fz={13}>
            Без установки Safari удаляет данные сайта, если не открывать его 7 дней.
          </Text>
        </Stack>
        <List type="ordered" fz="sm" spacing="xs">
          <List.Item>
            Нажмите «Поделиться» <ExportIcon size={14} style={{ verticalAlign: 'middle' }} /> в
            панели Safari
          </List.Item>
          <List.Item>
            Выберите «На экран Домой»{' '}
            <PlusSquareIcon size={14} style={{ verticalAlign: 'middle' }} />
          </List.Item>
          <List.Item>Откройте Tanuki с экрана Домой</List.Item>
        </List>
        <ModalButtonsLayout>
          <Button leftSection={<CheckIcon />}>Понятно</Button>
        </ModalButtonsLayout>
      </Stack>
    </ModalFrame>
  );
}

export default IosStepsModal;
