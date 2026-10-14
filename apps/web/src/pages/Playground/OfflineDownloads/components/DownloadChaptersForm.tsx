import { Button, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { countChaptersToDownload } from '../lib';
import { BRANCH_READ_UP_TO, BRANCH_TOTAL } from '../mocks';
import {
  DOWNLOAD_SCOPE,
  MODAL_PICKER,
  type DownloadFormValues,
  type DownloadScope,
  type ModalPicker,
} from '../models';
import DownloadSummary from './DownloadSummary';
import RangePresets from './RangePresets';
import ScopeRadioCards from './ScopeRadioCards';
import ScopeSegmented from './ScopeSegmented';

type Props = {
  picker: ModalPicker;
  freeMb: number;
  initialScope?: DownloadScope;
  /** В настоящей модалке: закрыть по «Отмене» и после отправки. */
  onClose?: () => void;
};

const NOTHING_TO_DOWNLOAD = 'Все выбранные главы уже скачаны или стоят в очереди';

/** Тело модалки «Скачать главы»: выбор по варианту оси M, строка объёма, кнопки. Проверка — по
 *  отправке, ошибка под полем. */
function DownloadChaptersForm({
  picker,
  freeMb,
  initialScope = DOWNLOAD_SCOPE.UNREAD,
  onClose,
}: Props) {
  const isPresets = picker === MODAL_PICKER.PRESETS;
  const form = useForm<DownloadFormValues>({
    initialValues: {
      scope: isPresets ? DOWNLOAD_SCOPE.RANGE : initialScope,
      from: isPresets ? BRANCH_READ_UP_TO + 1 : '',
      to: isPresets ? BRANCH_TOTAL : '',
    },
    validate: (values) => {
      if (values.scope !== DOWNLOAD_SCOPE.RANGE) {
        return countChaptersToDownload(values) === 0 ? { scope: NOTHING_TO_DOWNLOAD } : {};
      }
      if (values.from === '' || values.to === '') {
        return { to: 'Укажите, с какой и по какую главу' };
      }
      if (Number(values.from) > Number(values.to)) {
        return { to: 'Последняя глава раньше первой' };
      }
      return countChaptersToDownload(values) === 0 ? { to: NOTHING_TO_DOWNLOAD } : {};
    },
  });
  const count = countChaptersToDownload(form.values);

  return (
    <form onSubmit={form.onSubmit(() => (onClose ? onClose() : form.reset()))}>
      <Stack gap="md">
        <Stack gap={6}>
          <Text fz="sm">Главы встанут в конец очереди и скачаются по порядку чтения.</Text>
          <Text c="dimmed" fz={13}>
            Уже скачанные и стоящие в очереди главы повторно не добавятся.
          </Text>
        </Stack>
        {picker === MODAL_PICKER.SEGMENTED && <ScopeSegmented form={form} />}
        {picker === MODAL_PICKER.RADIO && <ScopeRadioCards form={form} />}
        {isPresets && <RangePresets form={form} />}
        <DownloadSummary count={count} freeMb={freeMb} />
        <ModalButtonsLayout>
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" leftSection={<DownloadSimpleIcon />}>
            Скачать главы
          </Button>
        </ModalButtonsLayout>
      </Stack>
    </form>
  );
}

export default DownloadChaptersForm;
