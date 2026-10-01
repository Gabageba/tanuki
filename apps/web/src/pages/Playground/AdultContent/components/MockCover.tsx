import type { ReactNode } from 'react';
import { Box, Center, Text } from '@mantine/core';
import { BLUR_STYLE, type BlurStyle, type MockTitle } from '../models';
import BlurOverlay from './BlurOverlay';

type Props = {
  title: MockTitle;
  blurred: boolean;
  blurStyle?: BlurStyle;
  /** Мини-обложка в строке настроек: меньше размытие, мельче надписи. */
  compact?: boolean;
  /** Метки поверх обложки — лента источника, бейдж 18+. */
  children?: ReactNode;
};

/**
 * Сгенерированная обложка: градиент, пара кругов и буква. Настоящих картинок в макете нет, а на
 * такой обложке размытие видно не хуже, чем на рисунке.
 */
function MockCover({
  title,
  blurred,
  blurStyle = BLUR_STYLE.PLAIN,
  compact = false,
  children,
}: Props) {
  const [from, to] = title.colors;

  return (
    <Box
      pos="relative"
      w="100%"
      style={{
        aspectRatio: '3 / 4',
        overflow: 'hidden',
        borderRadius: compact ? 'var(--mantine-radius-xs)' : 'var(--mantine-radius-md)',
      }}
    >
      {/* Размытие — только у рисунка: метки и подписи поверх должны читаться. Сила та же, что у
          .blurred в Title.module.scss; у мини-обложки пропорционально меньше. */}
      <Box
        pos="absolute"
        inset={0}
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-${from}-7), var(--mantine-color-${to}-4))`,
          filter: blurred ? `blur(${compact ? 4 : 20}px)` : undefined,
        }}
      >
        <Box
          pos="absolute"
          top="12%"
          left="-15%"
          w="70%"
          bg="white"
          opacity={0.3}
          style={{ aspectRatio: '1', borderRadius: '50%' }}
        />
        <Box
          pos="absolute"
          bottom="8%"
          right="-10%"
          w="55%"
          bg={`${to}.2`}
          opacity={0.6}
          style={{ aspectRatio: '1', borderRadius: '50%' }}
        />
        <Center pos="absolute" inset={0}>
          <Text c="white" fw={800} fz={compact ? 14 : 64} lh={1}>
            {title.name[0]}
          </Text>
        </Center>
      </Box>
      {blurred && <BlurOverlay blurStyle={blurStyle} compact={compact} />}
      {children}
    </Box>
  );
}

export default MockCover;
