import { ActionIcon, Anchor, Group, Table, Text, Tooltip } from '@mantine/core';
import { CopyIcon, StethoscopeIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getSourceStatusColor } from '@/entities/source/lib';
import useDateFormat from '@/shared/hooks/useDateFormat';
import Mdash from '@/shared/ui/Mdash';
import StatusIndicator from '@/shared/ui/StatusIndicator';
import { getReasonLabel, getStatusLabel } from '../lib';
import type { MockSource } from '../models';

type Props = {
  sources: MockSource[];
};

/** T0 — копия нынешней таблицы: семь столбцов, кнопка проверки в строке у всех. */
function CurrentHealthTable({ sources }: Props) {
  const { formatDate, formatRelative } = useDateFormat();

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
                  <Anchor component="button" type="button">
                    {source.title}
                  </Anchor>
                </Group>
              </Table.Td>
              <Table.Td>
                <StatusIndicator
                  color={getSourceStatusColor(source.status)}
                  label={getStatusLabel(source.status)}
                  dotMt={3}
                  coloredText
                />
                {source.statusChangedAt && (
                  <Text fz={11} c="dimmed">
                    с {formatDate(source.statusChangedAt)}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text fz={13}>
                  {source.statusReason ? getReasonLabel(source.statusReason) : <Mdash />}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text fz={13} c="dimmed">
                  {source.checkedAt ? formatRelative(source.checkedAt) : <Mdash />}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text fz={13} ff="monospace">
                  {source.failedProbeStreak}
                </Text>
              </Table.Td>
              <Table.Td maw={280}>
                {source.lastError ? (
                  <Group gap={4} wrap="nowrap" style={{ cursor: 'pointer' }}>
                    <Text fz={12} c="dimmed" lineClamp={2} style={{ flex: 1, minWidth: 0 }}>
                      {source.lastError}
                    </Text>
                    <CopyIcon size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
                  </Group>
                ) : (
                  <Text fz={12} c="dimmed">
                    <Mdash />
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Tooltip label="Прогнать проверку сейчас">
                  <ActionIcon variant="subtle" color="gray">
                    <StethoscopeIcon size={16} />
                  </ActionIcon>
                </Tooltip>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default CurrentHealthTable;
