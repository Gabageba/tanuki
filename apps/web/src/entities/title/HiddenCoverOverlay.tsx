import { Overlay } from '@mantine/core';
import { EyeSlashIcon } from '@phosphor-icons/react';

type Props = {
  size?: number;
};

/**
 * Перечёркнутый глаз поверх размытой обложки скрытого тайтла 18+ (размывает `BlurredCover`): без
 * глаза голое размытие читается как ошибка загрузки. Белый — он всегда поверх картинки, тема тут
 * не важна. Маркеры карточки (`zIndex: 1`) остаются над оверлеем.
 */
function HiddenCoverOverlay({ size = 40 }: Props) {
  return (
    <Overlay center backgroundOpacity={0} zIndex={0} c="white">
      <EyeSlashIcon size={size} />
    </Overlay>
  );
}

export default HiddenCoverOverlay;
