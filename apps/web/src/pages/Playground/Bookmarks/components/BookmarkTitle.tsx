import type { MantineStyleProps } from '@mantine/core';
import { Box, Group, Text } from '@mantine/core';
import { AVAILABILITY, CARD_VARIANT, type CardVariant, type MockBookmark } from '../models';
import NewCountBadge from './NewCountBadge';
import FirstLineDotTitle from './FirstLineDotTitle';
import NewDot from './NewDot';
import TrailingDotTitle from './TrailingDotTitle';
import titleStyles from '@/entities/title/Title.module.scss';

type Props = {
  bookmark: MockBookmark;
  variant: CardVariant;
  isDimmed: boolean;
  fz?: MantineStyleProps['fz'];
};

/** Название карточки с тем, что вариант добавляет к нему: бейдж «+3» (C3), точка перед ним
 *  (C10), после него (C10b), у правого края (C10c) или за ним с переездом вправо (C10d),
 *  вплотную за текстом или «…» (C10e), в конце первой строки (C10h), на поле слева (C10f),
 *  полужирное начертание (C11). */
function BookmarkTitle({ bookmark, variant, isDimmed, fz }: Props) {
  const hasNew = bookmark.availability === AVAILABILITY.AVAILABLE && bookmark.newChaptersCount > 0;

  const text = (
    <Text
      className={titleStyles.title}
      lineClamp={2}
      lh="tight"
      fz={fz}
      fw={hasNew && variant === CARD_VARIANT.BOLD_TITLE ? 700 : undefined}
      c={isDimmed ? 'dimmed' : undefined}
    >
      {bookmark.name}
      {/* C10b — точка в строку с текстом: у обрезанного названия уходит вместе с хвостом. */}
      {hasNew && variant === CARD_VARIANT.TITLE_DOT_END && (
        <Box
          component="span"
          display="inline-block"
          w={8}
          h={8}
          ml={6}
          bdrs="50%"
          bg="var(--mantine-primary-color-filled)"
          style={{ verticalAlign: 'middle' }}
          aria-label="Есть новые главы"
        />
      )}
    </Text>
  );

  if (hasNew && variant === CARD_VARIANT.TITLE) {
    return (
      <Group gap={6} wrap="nowrap" align="flex-start">
        <NewCountBadge count={bookmark.newChaptersCount} />
        {text}
      </Group>
    );
  }

  if (hasNew && variant === CARD_VARIANT.TITLE_DOT) {
    return (
      <Group gap={6} wrap="nowrap" align="flex-start">
        {/* Точка по центру первой строки: строка 1.3 × 16px ≈ 21px. */}
        <Box
          w={8}
          h={8}
          mt={7}
          bdrs="50%"
          flex="none"
          bg="var(--mantine-primary-color-filled)"
          aria-label="Есть новые главы"
        />
        {text}
      </Group>
    );
  }

  if (hasNew && variant === CARD_VARIANT.TITLE_DOT_RIGHT) {
    return (
      <Group gap={6} wrap="nowrap" align="flex-start" justify="space-between">
        <Box miw={0} flex={1}>
          {text}
        </Box>
        <Box
          w={8}
          h={8}
          mt={7}
          bdrs="50%"
          flex="none"
          bg="var(--mantine-primary-color-filled)"
          aria-label="Есть новые главы"
        />
      </Group>
    );
  }

  if (hasNew && variant === CARD_VARIANT.TITLE_DOT_AFTER) {
    // Название не растягивается, а только сжимается: короткое занимает свою ширину и точка
    // встаёт сразу за ним, длинное упирается в край — и точка оказывается у правого края.
    return (
      <Group gap={6} wrap="nowrap" align="flex-start">
        <Box miw={0} style={{ flex: '0 1 auto' }}>
          {text}
        </Box>
        <Box
          w={8}
          h={8}
          mt={7}
          bdrs="50%"
          flex="none"
          bg="var(--mantine-primary-color-filled)"
          aria-label="Есть новые главы"
        />
      </Group>
    );
  }

  if (hasNew && variant === CARD_VARIANT.TITLE_DOT_TRAILING) {
    return <TrailingDotTitle name={bookmark.name} fz={fz} />;
  }

  if (hasNew && variant === CARD_VARIANT.TITLE_DOT_FIRST_LINE) {
    return <FirstLineDotTitle name={bookmark.name} fz={fz} />;
  }

  if (hasNew && variant === CARD_VARIANT.TITLE_DOT_HANGING) {
    // Точка на поле левее текста: в промежутке между карточками (сетка) или в отступе (список).
    return (
      <Box pos="relative">
        <NewDot pos="absolute" left={-12} top={7} />
        {text}
      </Box>
    );
  }

  return text;
}

export default BookmarkTitle;
