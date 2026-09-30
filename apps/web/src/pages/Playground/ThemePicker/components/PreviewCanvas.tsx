import { Box } from '@mantine/core';

type Props = {
  dark: boolean;
  clipPath?: string;
};

/**
 * Схематичный экран приложения в одной из схем. Всё в процентах, поэтому одинаково читается и в
 * большой карточке, и в миниатюре 56×40. Цвета — статичные шаги `gray`/`dark`, а не ролевые
 * переменные: превью обязано показывать свою схему, а не текущую.
 */
function PreviewCanvas({ dark, clipPath }: Props) {
  const body = dark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-1)';
  const surface = dark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-white)';
  const border = dark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)';
  const line = dark ? 'var(--mantine-color-dark-3)' : 'var(--mantine-color-gray-4)';
  const block = dark ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)';

  return (
    <Box pos="absolute" inset={0} bg={body} style={{ clipPath }}>
      <Box
        pos="absolute"
        left="10%"
        right="10%"
        top="16%"
        bottom={0}
        bg={surface}
        style={{
          border: `1px solid ${border}`,
          borderBottom: 0,
          borderRadius: '12% 12% 0 0 / 18% 18% 0 0',
        }}
      >
        <Box
          pos="absolute"
          left="9%"
          top="14%"
          w="46%"
          h="9%"
          bg={line}
          style={{ borderRadius: 99 }}
        />
        <Box
          pos="absolute"
          left="9%"
          top="36%"
          w="24%"
          h="40%"
          bg={block}
          style={{ borderRadius: '12%' }}
        />
        <Box
          pos="absolute"
          left="38%"
          top="36%"
          w="24%"
          h="40%"
          bg={block}
          style={{ borderRadius: '12%' }}
        />
        <Box
          pos="absolute"
          left="67%"
          top="36%"
          w="24%"
          h="40%"
          bg="var(--mantine-primary-color-filled)"
          style={{ borderRadius: '12%' }}
        />
      </Box>
    </Box>
  );
}

export default PreviewCanvas;
