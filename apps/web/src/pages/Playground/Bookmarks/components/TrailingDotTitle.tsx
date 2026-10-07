import type { MantineStyleProps } from '@mantine/core';
import { Box, Text } from '@mantine/core';
import useIsClamped from '../hooks/useIsClamped';
import NewDot from './NewDot';
import titleStyles from '@/entities/title/Title.module.scss';

type Props = {
  name: string;
  fz?: MantineStyleProps['fz'];
};

/** Отступ справа под точку у обрезанного названия: точка 8px и зазор 6px. */
const DOT_SPACE = 14;

/**
 * C10e — точка всегда вплотную к тексту. Пока название целиком — она в строку за последним
 * словом. Обрезанное название кончается «…» у края — точку за ним средствами CSS не поставить
 * (`line-clamp` прячет всё после обрезки), поэтому она ставится поверх, на высоте последней
 * строки, а строке оставляется место под неё.
 */
function TrailingDotTitle({ name, fz }: Props) {
  const { ref, isClamped } = useIsClamped<HTMLParagraphElement>(name);

  return (
    <Box pos="relative" pr={isClamped ? DOT_SPACE : 0}>
      <Text ref={ref} className={titleStyles.title} lineClamp={2} lh="tight" fz={fz}>
        {name}
        {!isClamped && <NewDot inline ml={6} />}
      </Text>
      {/* Середина последней строки: строка 1.3em, точка 8px. */}
      {isClamped && <NewDot pos="absolute" right={0} bottom="calc(0.65em - 4px)" />}
    </Box>
  );
}

export default TrailingDotTitle;
