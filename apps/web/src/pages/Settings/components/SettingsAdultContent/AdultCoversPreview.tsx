import { Box, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import BlurredCover from '@/entities/title/BlurredCover';
import HiddenCoverOverlay from '@/entities/title/HiddenCoverOverlay';
import { PREVIEW_COVER_BLUR, PREVIEW_COVER_WIDTH, PREVIEW_COVERS } from './models';

type Props = {
  isBlurred: boolean;
};

/** Последняя строка блока: как обложки 18+ выглядят в каталоге при текущих настройках. */
function AdultCoversPreview({ isBlurred }: Props) {
  const { t } = useTranslation();

  return (
    <Group gap="md" wrap="nowrap" px="md" py="sm">
      <Group gap={6} wrap="nowrap" flex="none">
        {PREVIEW_COVERS.map(({ id, isAdult, colors: [from, to] }) => {
          const isHidden = isAdult && isBlurred;
          return (
            <Box
              key={id}
              pos="relative"
              w={PREVIEW_COVER_WIDTH}
              bdrs="xs"
              style={{ aspectRatio: '3 / 4', overflow: 'hidden' }}
            >
              <BlurredCover blur={isHidden ? PREVIEW_COVER_BLUR : 0}>
                <Box
                  pos="absolute"
                  inset={0}
                  style={{
                    background: `linear-gradient(135deg, var(--mantine-color-${from}-7), var(--mantine-color-${to}-4))`,
                  }}
                >
                  <Box
                    pos="absolute"
                    top="12%"
                    left="-15%"
                    w="70%"
                    bg="white"
                    opacity={0.3}
                    bdrs="50%"
                    style={{ aspectRatio: '1' }}
                  />
                  <Box
                    pos="absolute"
                    bottom="8%"
                    right="-10%"
                    w="55%"
                    bg={`${to}.2`}
                    opacity={0.6}
                    bdrs="50%"
                    style={{ aspectRatio: '1' }}
                  />
                </Box>
              </BlurredCover>
              {isHidden && <HiddenCoverOverlay size={14} />}
            </Box>
          );
        })}
      </Group>
      <Text fz={12} c="dimmed" lh={1.3}>
        {t('howAdultCoversLook')}
      </Text>
    </Group>
  );
}

export default AdultCoversPreview;
