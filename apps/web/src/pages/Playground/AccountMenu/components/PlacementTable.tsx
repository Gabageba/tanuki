import { Table, Text } from '@mantine/core';
import Mdash from '@/shared/ui/Mdash';
import PlacementSilhouette from './PlacementSilhouette';
import { getDrawerKindLabel } from '../lib';
import { DEVICE, type DrawerKind, type DrawerPlacement } from '../models';

type Props = {
  placements: DrawerPlacement[];
  /** Строки, где вариант отличается от D0, — выделены жирным. */
  changedKinds: DrawerKind[];
};

/** Схема сторон: строка на drawer, телефон, планшет и десктоп рядом. */
function PlacementTable({ placements, changedKinds }: Props) {
  return (
    <Table.ScrollContainer minWidth={760} maw={960}>
      <Table verticalSpacing="xs" withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Drawer</Table.Th>
            <Table.Th>Телефон</Table.Th>
            <Table.Th>Планшет</Table.Th>
            <Table.Th>Десктоп</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {placements.map((placement) => (
            <Table.Tr key={placement.kind}>
              <Table.Td>
                <Text fz="sm" fw={changedKinds.includes(placement.kind) ? 600 : undefined}>
                  {getDrawerKindLabel(placement.kind)}
                </Text>
              </Table.Td>
              <Table.Td>
                <PlacementSilhouette
                  position={placement.phone}
                  height={placement.phoneHeight}
                  device={DEVICE.PHONE}
                />
              </Table.Td>
              <Table.Td>
                {placement.tablet ? (
                  <PlacementSilhouette
                    position={placement.tablet}
                    height={placement.tabletHeight}
                    device={DEVICE.TABLET}
                  />
                ) : (
                  <Mdash c="dimmed" fz="sm" />
                )}
              </Table.Td>
              <Table.Td>
                {placement.desktop ? (
                  <PlacementSilhouette position={placement.desktop} device={DEVICE.DESKTOP} />
                ) : (
                  <Mdash c="dimmed" fz="sm" />
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default PlacementTable;
