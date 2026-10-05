import { Table } from '@mantine/core';
import { CalendarIcon, ClockIcon, MoonIcon, TagIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { SortDirection, Source } from '@tanuki/contracts';
import SortableTh from '@/shared/ui/SortableTh';
import SortMenuTh from '@/shared/ui/SortMenuTh';
import HealthStatusCell from './HealthStatusCell';
import ProbeCell from './ProbeCell';
import ReasonCell from './ReasonCell';
import SourceHealthCell from './SourceHealthCell';
import { HEALTH_COLUMN_WIDTH, HEALTH_SORT, type HealthSort } from './models';

type Props = {
  sources: Source[];
  sort: HealthSort;
  direction: SortDirection;
  onSortChange: (sort: HealthSort) => void;
  onOpen: (source: Source) => void;
};

/** Кнопок в строках нет: клик по строке открывает карточку источника с проверкой и ссылкой на
 *  каталог. На телефоне та же таблица листается вбок. */
function HealthTable({ sources, sort, direction, onSortChange, onOpen }: Props) {
  const { t } = useTranslation();
  const sortProps = { activeSort: sort, direction, onSortChange };

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table layout="fixed" verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <SortableTh sort={HEALTH_SORT.TITLE} w={HEALTH_COLUMN_WIDTH.SOURCE} {...sortProps}>
              {t('source')}
            </SortableTh>
            <SortMenuTh
              title={t('status')}
              w={HEALTH_COLUMN_WIDTH.STATUS}
              options={[
                {
                  sort: HEALTH_SORT.STATUS,
                  label: t('status'),
                  menuLabel: t('byStatus'),
                  icon: <TagIcon />,
                },
                {
                  sort: HEALTH_SORT.STATUS_CHANGED_AT,
                  label: t('date'),
                  menuLabel: t('byStatusChangeDate'),
                  icon: <CalendarIcon />,
                },
              ]}
              {...sortProps}
            />
            <SortMenuTh
              title={t('check')}
              w={HEALTH_COLUMN_WIDTH.CHECK}
              options={[
                {
                  sort: HEALTH_SORT.CHECKED_AT,
                  label: t('time'),
                  menuLabel: t('byCheckTime'),
                  icon: <ClockIcon />,
                },
                {
                  sort: HEALTH_SORT.FAILED_PROBE_STREAK,
                  label: t('nights'),
                  menuLabel: t('byFailedNightsInRow'),
                  icon: <MoonIcon />,
                },
              ]}
              {...sortProps}
            />
            {/* В «Причине» текст причины и ошибки — сортировать нечем. */}
            <Table.Th w={HEALTH_COLUMN_WIDTH.REASON}>{t('reason')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sources.map((source) => (
            <Table.Tr key={source.id} onClick={() => onOpen(source)} style={{ cursor: 'pointer' }}>
              <Table.Td>
                <SourceHealthCell source={source} />
              </Table.Td>
              <Table.Td>
                <HealthStatusCell source={source} />
              </Table.Td>
              <Table.Td>
                <ProbeCell source={source} />
              </Table.Td>
              <Table.Td>
                <ReasonCell source={source} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default HealthTable;
