import { Overlay } from '@mantine/core';
import { EyeSlashIcon } from '@phosphor-icons/react';

type Props = {
  size?: number;
  blur?: number;
};

/**
 * Размытие и перечёркнутый глаз поверх обложки скрытого тайтла 18+: без глаза голое размытие
 * читается как ошибка загрузки. Белый — он всегда поверх картинки, тема тут не важна.
 * Края размытия обрезает `overflow: hidden` обёртки, маркеры карточки (`zIndex: 1`) остаются над
 * оверлеем.
 */
function HiddenCoverOverlay({ size = 40, blur = 20 }: Props) {
  return (
    <Overlay center backgroundOpacity={0} blur={blur} zIndex={0} c="white">
      <EyeSlashIcon size={size} />
    </Overlay>
  );
}

export default HiddenCoverOverlay;
