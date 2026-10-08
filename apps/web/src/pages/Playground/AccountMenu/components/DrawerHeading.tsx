import type { ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';

type Props = {
  /** Иконка 40px, аватар или кнопка «назад» на внутреннем шаге. */
  icon: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  /** Подпись — показание (почта, домен, код): моноширинным. */
  isSubtitleMonospace?: boolean;
};

/** H2: заголовок drawer по одному шаблону — иконка, название, подпись. */
function DrawerHeading({ icon, title, subtitle, isSubtitleMonospace = false }: Props) {
  return (
    <Group gap="sm" wrap="nowrap" miw={0} flex={1}>
      {icon}
      <Stack gap={2} miw={0} flex={1}>
        <Text fw={600} fz="sm" lh="tight" truncate component="div">
          {title}
        </Text>
        <Text
          ff={isSubtitleMonospace ? 'monospace' : undefined}
          fz="xs"
          c="dimmed"
          lh="tight"
          truncate
        >
          {subtitle}
        </Text>
      </Stack>
    </Group>
  );
}

export default DrawerHeading;
