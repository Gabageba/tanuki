import { Stack, Table, Text } from '@mantine/core';
import Mdash from '@/shared/ui/Mdash';
import { formatCount } from '../lib';
import type { BackupPreview } from '../models';

type Props = {
  preview: BackupPreview;
};

type CountCellProps = {
  value: number;
};

function CountCell({ value }: CountCellProps) {
  return (
    <Table.Td ta="right" ff="monospace">
      {value === 0 ? <Mdash c="dimmed" /> : formatCount(value)}
    </Table.Td>
  );
}

/** S2 — таблица «часть × исход»: числа выровнены по столбцам, пояснения — под таблицей. */
function SummaryTable({ preview }: Props) {
  const { bookmarks, folders, progress, chapterReads } = preview;
  const rows = [
    {
      key: 'bookmarks',
      title: 'Закладки',
      added: bookmarks.added,
      existing: bookmarks.sameFolder + bookmarks.otherFolder,
      skipped: bookmarks.skipped,
    },
    {
      key: 'folders',
      title: 'Папки',
      added: folders.added,
      existing: folders.matched,
      skipped: folders.overLimit,
    },
    {
      key: 'progress',
      title: 'Где остановился',
      added: progress.added,
      existing: progress.differs,
      skipped: 0,
    },
    { key: 'chapters', title: 'Главы', added: chapterReads, existing: 0, skipped: 0 },
  ];
  const notes = [
    bookmarks.otherFolder > 0 &&
      `Из закладок, что уже есть, ${formatCount(bookmarks.otherFolder)} — в другой папке.`,
    progress.differs > 0 && 'Уже есть у «Где остановился» — отметки, что расходятся с вашими.',
    bookmarks.skipped > 0 && 'Пропущенные закладки — с источников, которых нет на этом инстансе.',
    folders.overLimit > 0 &&
      'Пропущенные папки не помещаются в лимит — их тайтлы лягут в «В планах».',
    'Настройки из копии применятся, если включить их ниже.',
  ].filter(Boolean);

  return (
    <Stack gap="xs">
      <Table fz="sm" verticalSpacing={6} horizontalSpacing="xs" withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th ta="right" fw={500}>
              Добавится
            </Table.Th>
            <Table.Th ta="right" fw={500}>
              Уже есть
            </Table.Th>
            <Table.Th ta="right" fw={500}>
              Пропущено
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map(({ key, title, added, existing, skipped }) => (
            <Table.Tr key={key}>
              <Table.Td>{title}</Table.Td>
              <CountCell value={added} />
              <CountCell value={existing} />
              <CountCell value={skipped} />
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {notes.map((note) => (
        <Text key={String(note)} c="dimmed" fz={13}>
          {note}
        </Text>
      ))}
    </Stack>
  );
}

export default SummaryTable;
