import type { MantineStyleProps } from '@mantine/core';
import { Box, Text } from '@mantine/core';
import useFirstLineEnd from '../hooks/useFirstLineEnd';
import { NEW_DOT_SPACE } from '../models';
import NewDot from './NewDot';
import titleStyles from '@/entities/title/Title.module.scss';

type Props = {
  name: string;
  hasNew: boolean;
  isDimmed: boolean;
  fz?: MantineStyleProps['fz'];
};

/**
 * Название карточки закладки. Обновлённая (C10h) — точка в конце первой строки, сразу за её
 * последним словом, сколько бы строк ни было. Где кончается первая строка, CSS не знает — она
 * измеряется. Место справа под точку держится всегда, чтобы перенос строк не зависел от неё.
 */
function BookmarkTitle({ name, hasNew, isDimmed, fz }: Props) {
  const { ref, end } = useFirstLineEnd<HTMLParagraphElement>(name);

  return (
    <Box pos="relative" pr={NEW_DOT_SPACE}>
      <Text
        ref={ref}
        className={titleStyles.title}
        lineClamp={2}
        lh="tight"
        fz={fz}
        c={isDimmed ? 'dimmed' : undefined}
      >
        {name}
      </Text>
      {/* Середина первой строки: строка 1.3em, точка 8px. */}
      {hasNew && end !== null && <NewDot pos="absolute" left={end + 6} top="calc(0.65em - 4px)" />}
    </Box>
  );
}

export default BookmarkTitle;
