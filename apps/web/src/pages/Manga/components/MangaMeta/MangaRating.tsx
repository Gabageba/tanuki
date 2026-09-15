import { Divider, Group, Rating, Stack, Text } from '@mantine/core';
import { StarFourIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  rating: number | null;
};

function MangaRating({ rating }: Props) {
  const { t } = useTranslation();

  if (!rating) {
    return null;
  }

  return (
    <>
      <Stack gap={4}>
        <Text fz={12} c="terracotta" lh={1}>
          {t('score')}
        </Text>
        <Group align="flex-end" gap={2}>
          <Text fz={40} lh={1} fw={600}>
            {rating}
          </Text>
          <Text lh={1} mb={4} fz={12} c="dimmed">
            /
          </Text>
          <Text mb={2} c="dimmed" lh={1}>
            10
          </Text>
        </Group>
        <Rating
          value={rating / 2}
          readOnly
          fractions={2}
          size={18}
          color="terracotta"
          styles={{ symbolBody: { lineHeight: 1 } }}
          emptySymbol={
            <StarFourIcon
              size={18}
              weight="regular"
              style={{
                color: 'var(--mantine-primary-color-filled)',
              }}
            />
          }
          fullSymbol={
            <StarFourIcon
              size={18}
              weight="fill"
              style={{
                color: 'var(--mantine-primary-color-filled)',
              }}
            />
          }
          count={5}
        />
      </Stack>
      <Divider orientation="vertical" visibleFrom="xs" />
      <Divider orientation="horizontal" hiddenFrom="xs" w="100%" />
    </>
  );
}

export default MangaRating;
