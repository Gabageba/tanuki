import { Group, Stack, Switch, Text, ThemeIcon } from '@mantine/core';
import { getCategoryDescription, getCategoryIcon, getCategoryLabel } from '../lib';
import type { MockCategory, MockRole } from '../models';

type Props = {
  category: MockCategory;
  role: MockRole;
};

/** Строка категории: иконка, название, что входит, тумблер push. */
function SettingsCategoryRow({ category, role }: Props) {
  return (
    <Group wrap="nowrap" align="center" gap="sm" justify="space-between">
      <Group wrap="nowrap" align="flex-start" gap="sm" flex={1} miw={0}>
        <ThemeIcon variant="muted" color="gray" size={36} radius="xl" flex="none">
          {getCategoryIcon(category)}
        </ThemeIcon>
        <Stack gap={2} flex={1} miw={0}>
          <Text fz="sm" fw={500}>
            {getCategoryLabel(category)}
          </Text>
          <Text fz={12} c="dimmed">
            {getCategoryDescription(category, role)}
          </Text>
        </Stack>
      </Group>
      <Switch defaultChecked aria-label={getCategoryLabel(category)} />
    </Group>
  );
}

export default SettingsCategoryRow;
