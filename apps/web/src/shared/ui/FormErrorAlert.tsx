import type { AlertProps } from '@mantine/core';
import { Alert, Box, Flex, Group } from '@mantine/core';
import { WarningCircleIcon } from '@phosphor-icons/react';

type Props = {
  error: string | null;
} & Omit<AlertProps, 'variant' | 'color' | 'px' | 'py' | 'styles'>;

function FormErrorAlert({ error, ...restProps }: Props) {
  if (!error) {
    return null;
  }

  return (
    <Alert
      {...restProps}
      variant="muted"
      color="red"
      px={12}
      py={6}
      styles={{
        message: {
          color: 'var(--mantine-color-red-text)',
        },
      }}
    >
      {/* Иконка не уходит на отдельную строку и стоит по центру первой строки текста. */}
      <Group gap={8} wrap="nowrap" align="flex-start">
        <Flex h="1lh" align="center" flex="none">
          <WarningCircleIcon />
        </Flex>
        <Box>{error}</Box>
      </Group>
    </Alert>
  );
}

export default FormErrorAlert;
