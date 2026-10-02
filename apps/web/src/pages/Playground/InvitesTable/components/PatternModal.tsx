import { useContext } from 'react';
import { Group, Modal, type ModalProps } from '@mantine/core';
import type { Icon } from '@phosphor-icons/react';
import { getMessageToneCssColor } from '../lib';
import {
  MESSAGE_PATTERN,
  NEUTRAL_COLOR_CONTEXT,
  type MessagePattern,
  type MessageTone,
} from '../models';

type Props = ModalProps & {
  pattern: MessagePattern;
  tone: MessageTone;
  icon: Icon;
};

const TOP_STRIPE_WIDTH = 3;

/** Modal, который M9 и M10 перекрашивают сам: иконка тона у заголовка или полоса по верхнему
 *  краю. В остальных паттернах — обычный Modal, тон живёт в тексте (`ModalMessage`). */
function PatternModal({ pattern, tone, icon: ToneIcon, title, ...props }: Props) {
  const neutral = useContext(NEUTRAL_COLOR_CONTEXT);
  const cssColor = getMessageToneCssColor(tone, neutral);

  return (
    <Modal
      {...props}
      title={
        pattern === MESSAGE_PATTERN.TITLE_ICON ? (
          <Group gap="xs" wrap="nowrap">
            <ToneIcon size={20} color={cssColor} style={{ flex: 'none' }} />
            {title}
          </Group>
        ) : (
          title
        )
      }
      styles={
        pattern === MESSAGE_PATTERN.TOP_STRIPE
          ? { content: { borderTop: `${TOP_STRIPE_WIDTH}px solid ${cssColor}` } }
          : undefined
      }
    />
  );
}

export default PatternModal;
