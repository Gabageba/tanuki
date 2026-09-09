import { Anchor, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import { generatePath, Link } from 'react-router';
import { SOURCE_STATUS, type Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import PageLayout from '@/shared/ui/PageLayout';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { flattenSources, getSourceStatusReasonLabel } from '@/entities/source/lib';
import { formatRelativeRu, formatRuDate, formatRuDateTime } from '@/shared/lib/formatDate';
import Mdash from '@/shared/ui/Mdash';
import type { SourcesHealthQuery } from './models';
import SourceHealthRowActions from './SourceHealthRowActions';
import SourceStatusBadge from '@/entities/source/components/SourceStatusBadge';

const getStatusWeight = (status: Source['status']) => {
  switch (status) {
    case SOURCE_STATUS.DOWN:
      return 0;
    case SOURCE_STATUS.DEGRADED:
      return 1;
    case SOURCE_STATUS.OK:
      return 2;
  }
};

function SourcesHealthTable() {
  const { data } = PageLayout.useQuery<SourcesHealthQuery>();
  const sources = flattenSources(data).sort(
    (left, right) =>
      getStatusWeight(left.status) - getStatusWeight(right.status) ||
      left.title.localeCompare(right.title),
  );

  return (
    <Table.ScrollContainer minWidth={860}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Источник</Table.Th>
            <Table.Th>Статус</Table.Th>
            <Table.Th>Причина</Table.Th>
            <Table.Th>Проверен</Table.Th>
            <Table.Th>Ночей подряд</Table.Th>
            <Table.Th>Последняя ошибка</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sources.map((source) => (
            <Table.Tr key={source.id}>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <SourceIcon id={source.id} title={source.title} />
                  <Anchor
                    component={Link}
                    to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
                  >
                    {source.title}
                  </Anchor>
                </Group>
              </Table.Td>
              <Table.Td>
                <SourceStatusBadge source={source} />
                {source.statusChangedAt && (
                  <Text fz={11} c="dimmed" ff="monospace">
                    {`с ${formatRuDate(source.statusChangedAt)}`}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text fz={13}>
                  {source.statusReason ? (
                    getSourceStatusReasonLabel(source.statusReason)
                  ) : (
                    <Mdash />
                  )}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text fz={13} ff="monospace" c="dimmed">
                  {source.checkedAt ? formatRelativeRu(source.checkedAt) : <Mdash />}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text fz={13} ff="monospace">
                  {source.failedProbeStreak}
                </Text>
              </Table.Td>
              <Table.Td maw={280}>
                {source.lastError ? (
                  <Tooltip
                    label={
                      <Stack gap={2}>
                        {source.checkedAt && (
                          <Text fz={11} c="dimmed" ff="monospace">
                            {formatRuDateTime(source.checkedAt)}
                          </Text>
                        )}
                        <Text fz={12} style={{ whiteSpace: 'pre-wrap' }}>
                          {source.lastError}
                        </Text>
                      </Stack>
                    }
                    multiline
                    maw={400}
                    events={{ hover: true, focus: true, touch: true }}
                  >
                    <Text fz={12} c="dimmed" lineClamp={2}>
                      {source.lastError}
                    </Text>
                  </Tooltip>
                ) : (
                  <Text fz={12} c="dimmed">
                    <Mdash />
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <SourceHealthRowActions source={source} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default SourcesHealthTable;
