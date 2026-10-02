import { useState } from 'react';
import {
  Button,
  Chip,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { CalendarBlankIcon, ChatTextIcon, ClockIcon, ProhibitIcon } from '@phosphor-icons/react';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import { getBlockDurationLabel, getBlockedUntil } from '../lib';
import {
  BLOCK_DURATION,
  BLOCK_FORM,
  BLOCK_KIND,
  type BlockDuration,
  type BlockForm,
  type BlockKind,
  type BlockPayload,
  type MockUser,
} from '../models';

type Props = {
  user: MockUser | null;
  form: BlockForm;
  onClose: () => void;
  onConfirm: (payload: BlockPayload) => void;
};

const TEMPORARY_DURATIONS: BlockDuration[] = [
  BLOCK_DURATION.DAY,
  BLOCK_DURATION.WEEK,
  BLOCK_DURATION.MONTH,
  BLOCK_DURATION.CUSTOM,
];

const ALL_DURATIONS = Object.values(BLOCK_DURATION);

const isBlockKind = (value: string): value is BlockKind =>
  Object.values(BLOCK_KIND).some((kind) => kind === value);

const isBlockDuration = (value: string | null): value is BlockDuration =>
  ALL_DURATIONS.some((duration) => duration === value);

/** Сегодняшняя дата в формате поля даты — раньше неё блокировку не закончить. */
const getToday = () => new Date().toISOString().slice(0, 10);

/** Ключ у родителя — id пользователя, так что при каждом открытии форма начинается заново. */
function BlockModal({ user, form, onClose, onConfirm }: Props) {
  const [kind, setKind] = useState<BlockKind>(BLOCK_KIND.TEMPORARY);
  const [duration, setDuration] = useState<BlockDuration>(BLOCK_DURATION.WEEK);
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState('');

  // В B1 «навсегда» выбирается переключателем, в B2 — пунктом того же списка.
  const effectiveDuration =
    form === BLOCK_FORM.SEGMENTED && kind === BLOCK_KIND.FOREVER
      ? BLOCK_DURATION.FOREVER
      : duration;
  const isCustom = effectiveDuration === BLOCK_DURATION.CUSTOM;
  const canSubmit = !isCustom || customDate !== '';

  const handleConfirm = () => {
    onConfirm({
      until: getBlockedUntil(effectiveDuration, customDate),
      reason: reason.trim() || null,
    });
  };

  return (
    <Modal opened={user !== null} onClose={onClose} title="Блокировка" centered>
      {user && (
        <Stack gap="md">
          <Text fz="sm">
            <Text span inherit fw={600}>
              {user.username}
            </Text>{' '}
            не сможет войти, пока блокировка не закончится. Все сеансы этого аккаунта завершатся
            сразу.
          </Text>

          {form === BLOCK_FORM.SEGMENTED ? (
            <Stack gap="xs">
              <SegmentedControl
                fullWidth
                value={kind}
                onChange={(value) => isBlockKind(value) && setKind(value)}
                data={[
                  { value: BLOCK_KIND.TEMPORARY, label: 'На срок' },
                  { value: BLOCK_KIND.FOREVER, label: 'Навсегда' },
                ]}
              />
              {kind === BLOCK_KIND.TEMPORARY && (
                <Chip.Group
                  value={duration}
                  onChange={(value) => isBlockDuration(value) && setDuration(value)}
                >
                  <Group gap="xs">
                    {TEMPORARY_DURATIONS.map((value) => (
                      <Chip key={value} value={value} size="sm">
                        {getBlockDurationLabel(value)}
                      </Chip>
                    ))}
                  </Group>
                </Chip.Group>
              )}
            </Stack>
          ) : (
            <Select
              label="Срок"
              leftSection={<ClockIcon />}
              data={ALL_DURATIONS.map((value) => ({
                value,
                label: getBlockDurationLabel(value),
              }))}
              value={duration}
              allowDeselect={false}
              onChange={(value) => isBlockDuration(value) && setDuration(value)}
            />
          )}

          {isCustom && (
            <TextInput
              type="date"
              label="До какого числа"
              leftSection={<CalendarBlankIcon />}
              min={getToday()}
              value={customDate}
              onChange={(event) => setCustomDate(event.currentTarget.value)}
            />
          )}

          <TextInput
            label="Причина"
            description="Её увидят персонал в таблице и сам пользователь при попытке войти"
            placeholder="Необязательно"
            leftSection={<ChatTextIcon />}
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
          />

          <ModalButtonsLayout>
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button
              color="red"
              leftSection={<ProhibitIcon />}
              disabled={!canSubmit}
              onClick={handleConfirm}
            >
              Заблокировать
            </Button>
          </ModalButtonsLayout>
        </Stack>
      )}
    </Modal>
  );
}

export default BlockModal;
