import { Box } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';
import type { RowProps } from '@/shared/ui/GroupedList/models';

type Props = RowProps & {
  locked: boolean;
};

/** Строка GroupedList, которая гаснет, пока её решает другая настройка (как в R3). */
function LockableRow({ locked, ...rowProps }: Props) {
  return (
    <Box opacity={locked ? 0.5 : 1}>
      <GroupedList.Row {...rowProps} />
    </Box>
  );
}

export default LockableRow;
