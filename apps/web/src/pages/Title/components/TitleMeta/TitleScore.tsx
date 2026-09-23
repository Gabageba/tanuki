import { Divider, Group, Rating, Stack, Text } from '@mantine/core';
import { HeartIcon, StarFourIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from '@/shared/lib/isEmpty';
import { formatCompactNumber } from '@tanuki/contracts';

type Props = {
  rating: number | null;
  likes: number | null;
};

function TitleScore({ rating, likes }: Props) {
  const { t } = useTranslation();
  const isRatingEmpty = isEmpty(rating);
  const isLikesEmpty = isEmpty(likes);

  if (isRatingEmpty && isLikesEmpty) {
    return null;
  }

  return (
    <>
      <Stack gap={4}>
        <Text fz={12} c="terracotta" lh={1}>
          {t('score')}
        </Text>
        <Group align={isRatingEmpty ? 'center' : 'flex-end'} gap={isRatingEmpty ? 8 : 2}>
          {isRatingEmpty && (
            <HeartIcon weight="fill" color="var(--mantine-primary-color-filled)" size={26} />
          )}
          <Text fz={40} lh={1} fw={600} ff="monospace" lts={-4}>
            {isRatingEmpty ? formatCompactNumber(likes!) : rating}
          </Text>
          {!isRatingEmpty && (
            <>
              <Text lh={1} mb={4} fz={12} c="dimmed" ff="monospace">
                /
              </Text>
              <Text mb={2} c="dimmed" lh={1} ff="monospace">
                10
              </Text>
            </>
          )}
        </Group>
        {!isRatingEmpty && (
          <Rating
            value={rating! / 2}
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
        )}
      </Stack>
      <Divider orientation="vertical" visibleFrom="xs" />
      <Divider orientation="horizontal" hiddenFrom="xs" w="100%" />
    </>
  );
}

export default TitleScore;
