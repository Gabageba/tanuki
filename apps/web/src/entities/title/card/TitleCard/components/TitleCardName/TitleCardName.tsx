import { Box, Text } from '@mantine/core';
import { VIEW_MODE } from '@tanuki/contracts';
import useTitleCardLayout from '../../hooks/useTitleCardLayout';
import useFirstLineEnd from './hooks/useFirstLineEnd';
import TitleCardUpdatesDot from './TitleCardUpdatesDot';
import { isTitleCardUnavailable } from '../../lib';
import { TITLE_CARD_NEW_DOT_SPACE, type TitleCardData } from '../../models';
import styles from '../../TitleCard.module.scss';

type Props = { data: TitleCardData; lines?: number };

function TitleCardName({ data, lines }: Props) {
  const { viewMode } = useTitleCardLayout();
  const isUnavailable = isTitleCardUnavailable(data);
  const hasNew = Boolean(data.hasNewChapters && !isUnavailable);
  const { ref, end } = useFirstLineEnd<HTMLParagraphElement>(data.name, hasNew);

  return (
    <Box pos="relative" pr={data.hasNewChapters === undefined ? 0 : TITLE_CARD_NEW_DOT_SPACE}>
      <Text
        ref={ref}
        title={data.name}
        data-card-name
        className={styles.title}
        lineClamp={lines ?? (viewMode === VIEW_MODE.LIST && data.description ? 1 : 2)}
        lh="tight"
        c={isUnavailable ? 'dimmed' : undefined}
      >
        {data.name}
      </Text>
      {hasNew && end !== null && (
        <TitleCardUpdatesDot pos="absolute" left={end + 6} top="calc(0.65em - 4px)" />
      )}
    </Box>
  );
}

export default TitleCardName;
