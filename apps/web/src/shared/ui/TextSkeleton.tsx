import type { MantineStyleProps, TextProps } from '@mantine/core';
import { Flex, Skeleton, Text } from '@mantine/core';

type Props = Pick<TextProps, 'fz' | 'lh' | 'size' | 'flex' | 'visibleFrom' | 'hiddenFrom'> & {
  /** Ширина блока — как у текста, который он заменяет. */
  w?: MantineStyleProps['w'];
  /** Число строк — как `lineClamp` у текста. */
  lines?: number;
  /** Ширина последней строки многострочного скелетона — от ширины блока. */
  lastLineWidth?: MantineStyleProps['w'];
};

/**
 * Скелетон строки текста, совпадающий с ней по высоте 1 в 1: обёртка — тот же `Text` с теми же
 * `fz`/`lh`, каждая строка — `1lh` (высота строчного бокса), а плашка внутри — `1em` по центру,
 * как глифы в строке. Меняется `lh` у текста — передайте тот же сюда, и высота подстроится сама.
 */
function TextSkeleton({ w = '100%', lines = 1, lastLineWidth = '60%', ...textProps }: Props) {
  return (
    <Text component="div" w={w} {...textProps}>
      {Array.from({ length: lines }).map((_, index) => (
        <Flex key={index} h="1lh" align="center">
          <Skeleton h="1em" w={lines > 1 && index === lines - 1 ? lastLineWidth : '100%'} />
        </Flex>
      ))}
    </Text>
  );
}

export default TextSkeleton;
