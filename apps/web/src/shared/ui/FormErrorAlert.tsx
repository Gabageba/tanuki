import type { AlertProps } from '@mantine/core';
import { Alert, Group } from '@mantine/core';
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
      <Group gap={8}>
        <WarningCircleIcon />
        {error}
      </Group>
    </Alert>
  );
}

export default FormErrorAlert;
