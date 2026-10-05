import { Group, Modal, type ModalProps } from '@mantine/core';
import type { Icon } from '@phosphor-icons/react';
import GoBackButton from '@/shared/ui/GoBackButton';
import { getModalToneColor, type ModalTone } from './models';

type Props = ModalProps & {
  tone: ModalTone;
  /** Иконка главной кнопки, если та про смысл, иначе — предмет модалки; никогда не крестик. */
  icon: Icon;
  /** Внутренний шаг: на месте иконки — «Назад». */
  onBack?: () => void;
};

/** Модалка с тоном: иконка 20px цвета тона у заголовка. В теле — главная фраза `fz="sm"` и
 *  пояснения `<Text c="dimmed" fz={13}>`, без иконок и цветных плашек. */
function ToneModal({ tone, icon: ToneIcon, onBack, title, centered = true, ...props }: Props) {
  return (
    <Modal
      {...props}
      centered={centered}
      title={
        <Group gap="xs" wrap="nowrap">
          {onBack ? (
            <GoBackButton onClick={onBack} />
          ) : (
            <ToneIcon size={20} color={getModalToneColor(tone)} style={{ flex: 'none' }} />
          )}
          {title}
        </Group>
      }
    />
  );
}

export default ToneModal;
