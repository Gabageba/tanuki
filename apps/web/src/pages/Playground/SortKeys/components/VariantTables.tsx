import { Paper, Stack, Text } from '@mantine/core';
import { TABLE_WIDTH, type SortHighlight, type SortPicker } from '../models';
import DemoInvitesTable from './DemoInvitesTable';
import DemoUsersTable from './DemoUsersTable';

type Props = {
  picker: SortPicker;
  highlight: SortHighlight;
};

/** Один вариант на обеих вкладках «Управления» — у каждой таблицы своя сортировка. */
function VariantTables({ picker, highlight }: Props) {
  return (
    <Stack gap="md" maw={TABLE_WIDTH}>
      <Stack gap={4}>
        <Text fz="xs" c="dimmed">
          Пользователи
        </Text>
        <Paper withBorder radius="md" px="xs">
          <DemoUsersTable picker={picker} highlight={highlight} />
        </Paper>
      </Stack>
      <Stack gap={4}>
        <Text fz="xs" c="dimmed">
          Приглашения
        </Text>
        <Paper withBorder radius="md" px="xs">
          <DemoInvitesTable picker={picker} highlight={highlight} />
        </Paper>
      </Stack>
    </Stack>
  );
}

export default VariantTables;
