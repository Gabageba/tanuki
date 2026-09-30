import { Box, type BoxProps } from '@mantine/core';
import { COLOR_SCHEME, type ColorScheme } from '@tanuki/contracts';
import PreviewCanvas from './PreviewCanvas';

type Props = BoxProps & {
  scheme: ColorScheme;
};

// Диагональ «системной»: слева светлая половина, справа тёмная.
const AUTO_CLIP_PATH = 'polygon(56% 0, 100% 0, 100% 100%, 44% 100%)';

/** Превью схемы: размер задаётся снаружи (`w`, `h`, `style.aspectRatio`). */
function SchemePreview({ scheme, style, ...props }: Props) {
  return (
    <Box pos="relative" flex="none" style={[{ overflow: 'hidden' }, style]} {...props}>
      <PreviewCanvas dark={scheme === COLOR_SCHEME.DARK} />
      {scheme === COLOR_SCHEME.AUTO && <PreviewCanvas dark clipPath={AUTO_CLIP_PATH} />}
    </Box>
  );
}

export default SchemePreview;
