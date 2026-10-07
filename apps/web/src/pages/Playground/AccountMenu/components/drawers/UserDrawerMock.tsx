import { Avatar, Badge, Divider, Group, Stack, Text } from '@mantine/core';
import { USER_ROLE } from '@tanuki/contracts';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import DrawerField from '@/shared/ui/DrawerField';
import RoleBadge from '../../../InvitesTable/components/RoleBadge';
import DrawerPanel from '../DrawerPanel';
import DrawerHeading from '../DrawerHeading';
import { HEADER_STYLE, type HeaderStyle } from '../../models';

type Props = {
  headerStyle: HeaderStyle;
};

const USERNAME = 'ivan.petrov';
const EMAIL = 'ivan.petrov@mail.ru';

function UserDrawerMock({ headerStyle }: Props) {
  const fields = (
    <Stack gap="sm">
      <DrawerField label="Роль">
        <RoleBadge role={USER_ROLE.MODERATOR} />
      </DrawerField>
      <DrawerField label="Статус">
        <Badge variant="muted" color="teal">
          Активен
        </Badge>
      </DrawerField>
      <DrawerField label="Регистрация">
        <Text fz="sm" ff="monospace">
          12.03.2026
        </Text>
      </DrawerField>
    </Stack>
  );

  if (headerStyle === HEADER_STYLE.TEXT) {
    return (
      <DrawerPanel title="Пользователь">
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap">
            <Avatar name={USERNAME} color={PRIMARY_COLOR} variant="outline" size={48} />
            <Stack gap={0} miw={0}>
              <Text fw={600} truncate>
                {USERNAME}
              </Text>
              <Text fz="sm" c="dimmed" ff="monospace" truncate>
                {EMAIL}
              </Text>
            </Stack>
          </Group>
          <Divider />
          {fields}
        </Stack>
      </DrawerPanel>
    );
  }

  return (
    <DrawerPanel
      title={
        <DrawerHeading
          icon={<Avatar name={USERNAME} color={PRIMARY_COLOR} variant="outline" size={40} />}
          title={USERNAME}
          subtitle={EMAIL}
          isSubtitleMonospace
        />
      }
    >
      {fields}
    </DrawerPanel>
  );
}

export default UserDrawerMock;
