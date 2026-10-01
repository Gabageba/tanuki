import { Group, Select, Text, type SelectProps } from '@mantine/core';
import { UsersThreeIcon } from '@phosphor-icons/react';
import type { Branch } from '@tanuki/contracts';
import { formatChaptersCount, getBranchName } from '../lib';

type Props = {
  branches: Branch[];
  value: string;
  onChange: (branchId: string) => void;
  size?: SelectProps['size'];
  w?: SelectProps['w'];
};

/** Ветка полем выбора: в закрытом поле — имя и число глав, в списке число глав прижато вправо. */
function BranchSelect({ branches, value, onChange, size, w }: Props) {
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  return (
    <Select
      aria-label="Ветка перевода"
      size={size}
      w={w}
      miw={0}
      leftSection={<UsersThreeIcon />}
      allowDeselect={false}
      value={value}
      onChange={(next) => next && onChange(next)}
      data={branches.map((branch) => ({
        value: branch.id,
        label: `${getBranchName(branch)} · ${formatChaptersCount(branch.chaptersCount)}`,
      }))}
      renderOption={({ option }) => {
        const branch = branchById.get(option.value);

        return (
          branch && (
            <Group justify="space-between" wrap="nowrap" w="100%" gap="sm">
              <Text fz="sm" lineClamp={1}>
                {getBranchName(branch)}
              </Text>
              <Text fz="sm" c="dimmed" flex="none">
                {formatChaptersCount(branch.chaptersCount)}
              </Text>
            </Group>
          )
        );
      }}
    />
  );
}

export default BranchSelect;
