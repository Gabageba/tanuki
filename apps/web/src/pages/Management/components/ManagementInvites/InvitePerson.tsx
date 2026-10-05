import { Avatar, Group, Text } from '@mantine/core';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import Mdash from '@/shared/ui/Mdash';

type Props = {
  /** null — человека нет: приглашение из консоли, или он уже удалён. */
  username: string | null;
  /** Аватар у имени — у зарегистрировавшегося, как в таблице пользователей. */
  withAvatar?: boolean;
  /** Своя картинка; без неё — инициалы. */
  avatarUrl?: string | null;
};

/** Имя человека в ячейке и карточке; нет имени — прочерк. */
function InvitePerson({ username, withAvatar = false, avatarUrl = null }: Props) {
  if (!username) {
    return <Mdash lh="tight" fz="sm" c="dimmed" />;
  }

  return (
    <Group gap="xs" wrap="nowrap" miw={0}>
      {withAvatar && (
        <Avatar
          src={avatarUrl}
          name={username}
          color={PRIMARY_COLOR}
          variant="outline"
          size={24}
          flex="none"
        />
      )}
      <Text lh="tight" fz="sm" truncate maw={200} title={username}>
        {username}
      </Text>
    </Group>
  );
}

export default InvitePerson;
