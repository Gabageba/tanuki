import { Stack, Switch, Table, Text } from '@mantine/core';
import { getCategoryDescription, getCategoryLabel, getVisibleCategories } from '../lib';
import type { DeviceState, MockRole } from '../models';
import SettingsDeviceBlock from './SettingsDeviceBlock';

type Props = {
  role: MockRole;
  deviceState: DeviceState;
};

/** S3: блок устройства и таблица категорий со столбцом «Push». */
function SettingsTableLayout({ role, deviceState }: Props) {
  return (
    <Stack gap="md">
      <Text fw={600}>Это устройство</Text>
      <SettingsDeviceBlock state={deviceState} />
      <Table.ScrollContainer minWidth={420}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Категория</Table.Th>
              <Table.Th>Что входит</Table.Th>
              <Table.Th ta="right">Push</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {getVisibleCategories(role).map((category) => (
              <Table.Tr key={category}>
                <Table.Td fw={500}>{getCategoryLabel(category)}</Table.Td>
                <Table.Td c="dimmed" fz={12}>
                  {getCategoryDescription(category, role)}
                </Table.Td>
                <Table.Td ta="right">
                  <Switch
                    defaultChecked
                    aria-label={getCategoryLabel(category)}
                    ml="auto"
                    w="fit-content"
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}

export default SettingsTableLayout;
