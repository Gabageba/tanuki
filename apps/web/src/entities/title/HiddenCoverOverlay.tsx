import { Overlay } from '@mantine/core';
import { EyeSlashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  size?: number;
};

/**
 * Перечёркнутый глаз поверх размытой обложки скрытого тайтла 18+.
 * Плотность подложки — как у недоступного источника; маркеры остаются над оверлеем.
 */
function HiddenCoverOverlay({ size = 40 }: Props) {
  const { t } = useTranslation();

  return (
    <Overlay
      center
      color="var(--mantine-color-body)"
      backgroundOpacity={0.85}
      zIndex={0}
      c="dimmed"
    >
      <EyeSlashIcon size={size} role="img" aria-label={t('adultContentHidden')} />
    </Overlay>
  );
}

export default HiddenCoverOverlay;
