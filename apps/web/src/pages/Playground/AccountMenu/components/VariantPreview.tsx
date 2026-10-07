import { Group, Stack, Text } from '@mantine/core';
import DesktopFrame from './DesktopFrame';
import { USERS } from '../mocks';
import type { Variant } from '../models';

type Props = {
  variant: Variant;
};

/** Вариант в двух состояниях: сверху меню в шапке десктопа, снизу — телефон 375px. */
function VariantPreview({ variant }: Props) {
  return (
    <Stack gap="lg">
      <Group align="flex-start" gap="lg">
        {USERS.map((user) => (
          <Stack key={user.username} gap={6} w={520} maw="100%">
            <Text fz="xs" c="dimmed">
              Десктоп · {user.caption}
            </Text>
            <DesktopFrame user={user} menuWidth={variant.menuWidth}>
              {variant.renderDesktop(user)}
            </DesktopFrame>
          </Stack>
        ))}
      </Group>
      <Group align="flex-start" gap="lg">
        {USERS.map((user) => (
          <Stack key={user.username} gap={6}>
            <Text fz="xs" c="dimmed">
              Телефон · {user.caption}
            </Text>
            {variant.renderMobile(user)}
          </Stack>
        ))}
      </Group>
    </Stack>
  );
}

export default VariantPreview;
