import { Box, Text } from '@mantine/core';
import TitleCardUpdatesDot from '@/entities/title/card/TitleCard/components/TitleCardName/TitleCardUpdatesDot';
import { isTitleCardUnavailable } from '@/entities/title/card/TitleCard/lib';
import {
  TITLE_CARD_NEW_DOT_SPACE,
  type TitleCardData,
} from '@/entities/title/card/TitleCard/models';
import type { UpdateVariant } from '../../models';
import { getTitleDotPosition } from '../../lib';
import useTitleTextBounds from './hooks/useTitleTextBounds';
import styles from '@/entities/title/card/TitleCard/TitleCard.module.scss';

type Props = { data: TitleCardData; variant: UpdateVariant; hasNew: boolean };

function BookmarkUpdatesDotName({ data, variant, hasNew }: Props) {
  const { ref, bounds } = useTitleTextBounds(data.name, hasNew);

  return (
    <Box pos="relative" pr={TITLE_CARD_NEW_DOT_SPACE}>
      <Text
        ref={ref}
        data-card-name
        className={styles.title}
        lineClamp={2}
        lh="tight"
        c={isTitleCardUnavailable(data) ? 'dimmed' : undefined}
      >
        {data.name}
      </Text>
      {hasNew && bounds && (
        <TitleCardUpdatesDot pos="absolute" {...getTitleDotPosition(variant, bounds)} />
      )}
    </Box>
  );
}

export default BookmarkUpdatesDotName;
