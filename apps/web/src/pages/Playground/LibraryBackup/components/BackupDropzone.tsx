import type { ReactNode } from 'react';
import { ActionIcon, Box, Button, FileButton, Group, Stack, Text } from '@mantine/core';
import { FileIcon, UploadSimpleIcon, XIcon } from '@phosphor-icons/react';

type Props = {
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: ReactNode;
};

const getBorderColor = (hasError: boolean) =>
  hasError ? 'var(--mantine-color-error)' : 'var(--mantine-color-default-border)';

/** F2 — зона перетаскивания. В песочнице перетаскивание не работает, только кнопка выбора;
 *  выбранный файл заменяет зону строкой с крестиком. */
function BackupDropzone({ value, onChange, error }: Props) {
  const hasError = Boolean(error);

  return (
    <Stack gap={4}>
      {value ? (
        <Group
          gap="sm"
          wrap="nowrap"
          p="sm"
          style={{
            border: `1px solid ${getBorderColor(hasError)}`,
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <FileIcon size={24} color="var(--mantine-color-dimmed)" style={{ flex: 'none' }} />
          <Stack gap={2} flex={1} miw={0}>
            <Text fz="sm" ff="monospace" style={{ overflowWrap: 'anywhere' }}>
              {value.name}
            </Text>
            <Text fz={12} c="dimmed" ff="monospace">
              412 КБ
            </Text>
          </Stack>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Убрать файл"
            onClick={() => onChange(null)}
          >
            <XIcon />
          </ActionIcon>
        </Group>
      ) : (
        <Box
          p="lg"
          style={{
            border: `1px dashed ${getBorderColor(hasError)}`,
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <Stack gap="xs" align="center">
            <UploadSimpleIcon size={32} color="var(--mantine-color-dimmed)" />
            <Text fz="sm" ta="center">
              Перетащите копию сюда
            </Text>
            <FileButton accept="application/json,.json" onChange={onChange}>
              {(props) => (
                <Button {...props} variant="light" size="xs" leftSection={<FileIcon />}>
                  Выбрать файл копии
                </Button>
              )}
            </FileButton>
            <Text fz={12} c="dimmed" ff="monospace">
              JSON · до 20 МБ
            </Text>
          </Stack>
        </Box>
      )}
      {error && (
        <Text fz={12} c="var(--mantine-color-error)">
          {error}
        </Text>
      )}
    </Stack>
  );
}

export default BackupDropzone;
