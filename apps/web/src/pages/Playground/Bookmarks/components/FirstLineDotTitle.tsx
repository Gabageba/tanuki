import type { MantineStyleProps } from '@mantine/core';
import { Box, Text } from '@mantine/core';
import useFirstLineEnd from '../hooks/useFirstLineEnd';
import NewDot from './NewDot';
import titleStyles from '@/entities/title/Title.module.scss';

type Props = {
  name: string;
  fz?: MantineStyleProps['fz'];
};

/** Место справа под точку: точка 8px и зазор 6px — чтобы она влезла и за полной строкой. */
const DOT_SPACE = 14;

/**
 * C10h — точка в конце первой строки, сразу за её последним словом, сколько бы строк ни было.
 * Где кончается первая строка, CSS не знает — она измеряется, и точка ставится туда.
 */
function FirstLineDotTitle({ name, fz }: Props) {
  const { ref, end } = useFirstLineEnd<HTMLParagraphElement>(name);

  return (
    <Box pos="relative" pr={DOT_SPACE}>
      <Text ref={ref} className={titleStyles.title} lineClamp={2} lh="tight" fz={fz}>
        {name}
      </Text>
      {/* Середина первой строки: строка 1.3em, точка 8px. */}
      {end !== null && <NewDot pos="absolute" left={end + 6} top="calc(0.65em - 4px)" />}
    </Box>
  );
}

export default FirstLineDotTitle;
