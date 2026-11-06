import { Box, Text } from '@mantine/core';
import { isTitleCardUnavailable } from '@/entities/title/card/TitleCard/lib';
import type { TitleCardData } from '@/entities/title/card/TitleCard/models';
import styles from '@/entities/title/card/TitleCard/TitleCard.module.scss';

type Props = { data: TitleCardData; hasNew: boolean; short?: boolean };

function BookmarkUpdatesLineName({ data, hasNew, short = false }: Props) {
  const isUnavailable = isTitleCardUnavailable(data);

  return (
    <Box data-name-line pos="relative" pl={8} fz="sm" lh="tight">
      <Text
        data-card-name
        className={styles.title}
        lineClamp={2}
        lh="tight"
        c={isUnavailable ? 'dimmed' : undefined}
      >
        {data.name}
      </Text>
      {hasNew && !isUnavailable && (
        <Box
          pos="absolute"
          left={0}
          top={short ? 'calc((1lh - 12px) / 2)' : 2}
          bottom={short ? undefined : 2}
          w={2}
          h={short ? 12 : undefined}
          bdrs={1}
          bg="var(--mantine-primary-color-filled)"
          role="img"
          aria-label="Есть новые главы"
        />
      )}
    </Box>
  );
}

export default BookmarkUpdatesLineName;
