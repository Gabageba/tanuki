import type { ReactNode } from 'react';
import { Alert, Blockquote, Box, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import type { Icon } from '@phosphor-icons/react';
import { getMessageToneColor, getMessageToneCssColor } from '../lib';
import { MESSAGE_PATTERN, type MessagePattern, type MessageTone } from '../models';

type Props = {
  pattern: MessagePattern;
  tone: MessageTone;
  /** Иконка смысла — `TrashIcon`; размер ставит паттерн. */
  icon: Icon;
  /** Главное: что произойдёт. */
  main: ReactNode;
  /** Пояснения и последствия — по абзацу на пункт. */
  details?: ReactNode[];
  /** M0: как текст подан в этой модалке сейчас. */
  current: ReactNode;
};

const STRIPE_WIDTH = 3;

/** Текст модалки по выбранному паттерну M. Поля и кнопки идут после него, паттерн их не трогает.
 *  M9 и M10 меняют саму модалку (`PatternModal`), текст у них — как в M2. */
function ModalMessage({ pattern, tone, icon: MessageIcon, main, details = [], current }: Props) {
  const color = getMessageToneColor(tone);
  const cssColor = getMessageToneCssColor(tone);
  const stripe = { borderLeft: `${STRIPE_WIDTH}px solid ${cssColor}` };

  const mainText = <Text fz="sm">{main}</Text>;
  const detailTexts = details.map((detail, index) => (
    <Text key={index} c="dimmed" fz={13}>
      {detail}
    </Text>
  ));

  switch (pattern) {
    case MESSAGE_PATTERN.CURRENT:
      return current;

    case MESSAGE_PATTERN.ICON_ASIDE:
      return (
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon variant="light" color={color} size={36} radius="xl" flex="none">
            <MessageIcon size={20} />
          </ThemeIcon>
          <Stack gap={6} miw={0} pt={8}>
            {mainText}
            {detailTexts}
          </Stack>
        </Group>
      );

    case MESSAGE_PATTERN.PLAIN:
    case MESSAGE_PATTERN.TITLE_ICON:
    case MESSAGE_PATTERN.TOP_STRIPE:
      return (
        <Stack gap={6}>
          {mainText}
          {detailTexts}
        </Stack>
      );

    case MESSAGE_PATTERN.CENTERED:
      return (
        <Stack gap={6} align="center" ta="center">
          <ThemeIcon variant="light" color={color} size={56} radius="xl" mb="xs">
            <MessageIcon size={28} />
          </ThemeIcon>
          {mainText}
          {detailTexts}
        </Stack>
      );

    case MESSAGE_PATTERN.ALERT:
      return (
        <Stack gap="sm">
          {mainText}
          {details.length > 0 && (
            <Alert variant="light" color={color} icon={<MessageIcon size={20} />} p="sm">
              <Stack gap={4}>
                {details.map((detail, index) => (
                  <Text key={index} fz={13}>
                    {detail}
                  </Text>
                ))}
              </Stack>
            </Alert>
          )}
        </Stack>
      );

    case MESSAGE_PATTERN.STRIPE:
      return (
        <Stack gap={6} pl="sm" style={stripe}>
          {mainText}
          {detailTexts}
        </Stack>
      );

    case MESSAGE_PATTERN.DETAILS_STRIPE:
      return (
        <Stack gap="xs">
          {mainText}
          {details.length > 0 && (
            <Stack gap={6} pl="sm" style={stripe}>
              {detailTexts}
            </Stack>
          )}
        </Stack>
      );

    case MESSAGE_PATTERN.BLOCKQUOTE:
      return (
        <Blockquote
          color={color}
          icon={<MessageIcon size={16} />}
          iconSize={28}
          radius="sm"
          py="sm"
          pl="lg"
          pr="sm"
          ml={14}
        >
          <Stack gap={6}>
            {mainText}
            {detailTexts}
          </Stack>
        </Blockquote>
      );

    case MESSAGE_PATTERN.TINTED:
      return (
        <Box
          bg={`var(--mantine-color-${color}-light)`}
          p="sm"
          style={{ ...stripe, borderRadius: 'var(--mantine-radius-sm)' }}
        >
          <Stack gap={6}>
            {mainText}
            {detailTexts}
          </Stack>
        </Box>
      );

    case MESSAGE_PATTERN.INLINE_ICON:
      return (
        <Stack gap={6}>
          <Group gap={6} wrap="nowrap" align="flex-start">
            <Box
              component="span"
              c={cssColor}
              h="1lh"
              fz="sm"
              display="flex"
              flex="none"
              style={{ alignItems: 'center' }}
            >
              <MessageIcon size={16} />
            </Box>
            {mainText}
          </Group>
          {detailTexts}
        </Stack>
      );
  }
}

export default ModalMessage;
