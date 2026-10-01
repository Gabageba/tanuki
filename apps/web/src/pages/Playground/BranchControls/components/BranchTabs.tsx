import { Group, Scroller, Tabs, Text } from '@mantine/core';
import { UsersThreeIcon } from '@phosphor-icons/react';
import type { Branch } from '@tanuki/contracts';
import { formatChaptersCount, getBranchName } from '../lib';

type Props = {
  branches: Branch[];
  value: string;
  onChange: (branchId: string) => void;
  /** false — как сейчас в приложении, без иконки в leftSection. */
  withIcon?: boolean;
};

/** Ветки tile-табами — разметка из TitleChaptersTabContent. */
function BranchTabs({ branches, value, onChange, withIcon = true }: Props) {
  return (
    <Tabs variant="tile" value={value} onChange={(next) => next && onChange(next)}>
      <Tabs.List>
        <Scroller>
          <Group gap={8} wrap="nowrap">
            {branches.map((branch) => (
              <Tabs.Tab
                key={branch.id}
                value={branch.id}
                leftSection={withIcon && <UsersThreeIcon />}
                rightSection={
                  <Text c={value === branch.id ? 'terracotta' : 'dimmed'} fz={12}>
                    {formatChaptersCount(branch.chaptersCount)}
                  </Text>
                }
              >
                {getBranchName(branch)}
              </Tabs.Tab>
            ))}
          </Group>
        </Scroller>
      </Tabs.List>
    </Tabs>
  );
}

export default BranchTabs;
