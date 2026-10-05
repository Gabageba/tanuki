import { Table } from '@mantine/core';
import { CalendarIcon, ClockIcon, MoonIcon, TagIcon } from '@phosphor-icons/react';
import SortableTh from './SortableTh';
import SortMenuTh from './SortMenuTh';
import {
  COLUMN_WIDTH,
  HEALTH_SORT,
  TABLE_LAYOUT,
  type HealthSort,
  type MockSource,
  type SortState,
  type TableLayout,
} from '../models';
import { getExtraColumnTitle, hasExtraColumn } from '../lib';
import ErrorCell from './ErrorCell';
import HealthStatusCell from './HealthStatusCell';
import NightsStrip from './NightsStrip';
import ProbeCell from './ProbeCell';
import ReasonCell from './ReasonCell';
import SourceHealthCell from './SourceHealthCell';

type Props = {
  sources: MockSource[];
  layout: TableLayout;
  sortState: SortState;
  onSortChange: (sort: HealthSort) => void;
  onOpen: (source: MockSource) => void;
};

/** T1–T5: составные ячейки, кнопок в строках нет, клик по строке открывает карточку. Четвёртый
 *  столбец — ошибка (T1), полоска ночей (T4) или причина с ошибкой (T5); в T2 и T3 его нет. */
function HealthTable({ sources, layout, sortState, onSortChange, onOpen }: Props) {
  const sortProps = { activeSort: sortState.sort, direction: sortState.direction, onSortChange };
  const withExtraColumn = hasExtraColumn(layout);
  const extraColumnTitle = getExtraColumnTitle(layout);
  const width = withExtraColumn ? COLUMN_WIDTH.WIDE : COLUMN_WIDTH.NARROW;

  return (
    <Table.ScrollContainer minWidth={withExtraColumn ? 760 : 620}>
      <Table layout="fixed" verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortableTh sort={HEALTH_SORT.TITLE} w={width.SOURCE} {...sortProps}>
              Источник
            </SortableTh>
            <SortMenuTh
              title="Статус"
              w={width.STATUS}
              options={[
                {
                  sort: HEALTH_SORT.STATUS,
                  label: 'Статус',
                  menuLabel: 'По статусу',
                  icon: <TagIcon />,
                },
                {
                  sort: HEALTH_SORT.STATUS_CHANGED_AT,
                  label: 'Дата',
                  menuLabel: 'По дате смены статуса',
                  icon: <CalendarIcon />,
                },
              ]}
              {...sortProps}
            />
            <SortMenuTh
              title="Проверка"
              w={width.PROBE}
              options={[
                {
                  sort: HEALTH_SORT.CHECKED_AT,
                  label: 'Время',
                  menuLabel: 'По времени проверки',
                  icon: <ClockIcon />,
                },
                {
                  sort: HEALTH_SORT.FAILED_PROBE_STREAK,
                  label: 'Ночи',
                  menuLabel: 'По упавшим ночам подряд',
                  icon: <MoonIcon />,
                },
              ]}
              {...sortProps}
            />
            {extraColumnTitle && (
              <Table.Th w={COLUMN_WIDTH.WIDE.EXTRA}>{extraColumnTitle}</Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sources.map((source) => (
            <Table.Tr key={source.id} onClick={() => onOpen(source)} style={{ cursor: 'pointer' }}>
              <Table.Td>
                <SourceHealthCell source={source} />
              </Table.Td>
              <Table.Td>
                <HealthStatusCell
                  source={source}
                  withError={layout === TABLE_LAYOUT.ERROR_UNDER_STATUS}
                  withReason={layout !== TABLE_LAYOUT.REASON_COLUMN}
                />
              </Table.Td>
              <Table.Td>
                <ProbeCell source={source} />
              </Table.Td>
              {layout === TABLE_LAYOUT.ERROR_COLUMN && (
                <Table.Td>
                  <ErrorCell error={source.lastError} />
                </Table.Td>
              )}
              {layout === TABLE_LAYOUT.NIGHTS_STRIP && (
                <Table.Td>
                  <NightsStrip nights={source.nights} />
                </Table.Td>
              )}
              {layout === TABLE_LAYOUT.REASON_COLUMN && (
                <Table.Td>
                  <ReasonCell source={source} />
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default HealthTable;
