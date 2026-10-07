import type { ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';

type Props = {
  /** Аватар, логотип или иконка — 40px. */
  icon: ReactNode;
  title: string;
  /** Бейдж после названия: роль, «Вы». */
  badge?: ReactNode;
  /** Показание — почта, домен: моноширинным. */
  subtitle: string;
};

/** Карточка одной записи — в заголовке drawer и наверху меню аккаунта: иконка, название и
 *  подпись, обе строки обрезаются многоточием. */
function EntityHeading({ icon, title, badge, subtitle }: Props) {
  return (
    <Group gap="sm" wrap="nowrap" miw={0} flex={1}>
      {icon}
      <Stack gap={2} miw={0} flex={1}>
        <Group gap={6} wrap="nowrap" miw={0}>
          <Text fz="sm" fw={600} c="var(--mantine-color-text)" lh="tight" truncate>
            {title}
          </Text>
          {badge}
        </Group>
        <Text ff="monospace" fz={11} fw={400} c="dimmed" lh="tight" truncate>
          {subtitle}
        </Text>
      </Stack>
    </Group>
  );
}

export default EntityHeading;
