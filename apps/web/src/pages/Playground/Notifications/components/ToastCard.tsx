import { Anchor, Stack, Text } from '@mantine/core';
import { ArrowRightIcon } from '@phosphor-icons/react';
import {
  getCategoryIcon,
  getNotificationDetail,
  getNotificationTitle,
  getToneColor,
  getTypeCategory,
  getTypeIcon,
  getTypeTone,
} from '../lib';
import {
  TOAST_ACTION,
  TOAST_TONE,
  type MockNotification,
  type ToastAction,
  type ToastTone,
} from '../models';
import ToastShell from './ToastShell';

type Props = {
  item: MockNotification;
  action: ToastAction;
  tone: ToastTone;
};

/** Тост о важном событии. Тон: свой у каждой категории или единый нейтральный; переход к цели —
 *  по всему тосту, отдельной ссылкой или никакого. */
function ToastCard({ item, action, tone }: Props) {
  const detail = getNotificationDetail(item);
  const isNeutral = tone === TOAST_TONE.NEUTRAL;

  return (
    <ToastShell
      icon={
        isNeutral ? getCategoryIcon(getTypeCategory(item.type), 18) : getTypeIcon(item.type, 18)
      }
      color={isNeutral ? 'gray' : getToneColor(getTypeTone(item.type))}
      isClickable={action === TOAST_ACTION.WHOLE}
    >
      <Stack gap={2}>
        <Text fz="sm" fw={500}>
          {getNotificationTitle(item)}
        </Text>
        {detail && (
          <Text fz={12} c="dimmed">
            {detail}
          </Text>
        )}
        {action === TOAST_ACTION.LINK && (
          <Anchor component="button" type="button" fz="sm" mt={4} w="fit-content">
            Открыть <ArrowRightIcon size={12} style={{ verticalAlign: 'middle' }} />
          </Anchor>
        )}
      </Stack>
    </ToastShell>
  );
}

export default ToastCard;
