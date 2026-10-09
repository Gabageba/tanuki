import type { ReactNode } from 'react';
import { Box, Flex, Stack, Text } from '@mantine/core';
import PhoneFrame from '../../Bookmarks/components/PhoneFrame';

type Props = {
  /** Что показать на десктопе; оно же в рамке телефона, если `phone` не задан. */
  children: ReactNode;
  phone?: ReactNode;
  /** Ещё рамки телефона рядом — другое состояние того же варианта. */
  extraPhones?: { label: string; content: ReactNode }[];
  desktopLabel?: string;
  phoneLabel?: string;
};

/** Вариант в ширине десктопа и в рамке телефона 375 px рядом. */
function VariantFrames({
  children,
  phone,
  extraPhones = [],
  desktopLabel = 'Десктоп',
  phoneLabel,
}: Props) {
  return (
    <Flex gap="lg" wrap="wrap" align="flex-start">
      <Stack gap={6} flex="1 1 640px" miw={0} maw={1100}>
        <Text fz={12} c="dimmed" ff="monospace">
          {desktopLabel}
        </Text>
        <Box
          p="md"
          bd="1px solid var(--mantine-color-default-border)"
          bdrs="lg"
          bg="var(--mantine-color-body)"
        >
          {children}
        </Box>
      </Stack>
      <PhoneFrame label={phoneLabel}>{phone ?? children}</PhoneFrame>
      {extraPhones.map(({ label, content }) => (
        <PhoneFrame key={label} label={label}>
          {content}
        </PhoneFrame>
      ))}
    </Flex>
  );
}

export default VariantFrames;
