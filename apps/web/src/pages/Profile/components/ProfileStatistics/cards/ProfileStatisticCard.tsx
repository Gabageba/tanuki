import { Box, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import { type ReactNode } from 'react';

type Props = {
  label: string;
  children: ReactNode;
  extra?: ReactNode | string;
  footer?: ReactNode;
};

function ProfileStatisticCard({ label, extra, children, footer }: Props) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="lg" h="100%">
        <Group justify="space-between" wrap="nowrap" align={'flex-start'}>
          <Text fw={600} fz={16}>
            {label}
          </Text>
          {typeof extra === 'string' ? (
            <Text fz={12} c="dimmed" ta="right">
              {extra}
            </Text>
          ) : (
            extra
          )}
        </Group>
        <Box flex={1}>{children}</Box>
        {footer && (
          <>
            <Divider />
            {footer}
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default ProfileStatisticCard;
