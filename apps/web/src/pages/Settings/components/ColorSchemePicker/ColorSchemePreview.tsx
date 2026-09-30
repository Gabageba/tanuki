import { Box } from '@mantine/core';
import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';
import PreviewCanvas from './PreviewCanvas';

type Props = {
  colorScheme: ColorScheme;
};

// Диагональ «системной»: слева светлая половина, справа тёмная.
const AUTO_CLIP_PATH = 'polygon(56% 0, 100% 0, 100% 100%, 44% 100%)';

/** Миниатюра схемы на месте иконки строки. */
function ColorSchemePreview({ colorScheme }: Props) {
  return (
    <Box
      pos="relative"
      flex="none"
      w={52}
      h={36}
      style={{
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-sm)',
      }}
    >
      <PreviewCanvas dark={colorScheme === COLOR_SCHEME.DARK} />
      {colorScheme === COLOR_SCHEME.AUTO && <PreviewCanvas dark clipPath={AUTO_CLIP_PATH} />}
    </Box>
  );
}

export default ColorSchemePreview;
