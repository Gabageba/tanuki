import { Avatar, Group, Text } from '@mantine/core';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import Mdash from '@/shared/ui/Mdash';

type Props = {
  /** null — нет человека: приглашение от скрипта или ещё не использовано. */
  username: string | null;
  /** Аватар у имени — в составных ячейках, как у пользователей. */
  withAvatar?: boolean;
};

/** Имя человека в ячейке; нет имени — прочерк. */
function PersonName({ username, withAvatar = false }: Props) {
  if (!username) {
    return <Mdash fz="sm" c="dimmed" />;
  }

  return (
    <Group gap="xs" wrap="nowrap" miw={0}>
      {withAvatar && (
        <Avatar name={username} color={PRIMARY_COLOR} variant="outline" size={24} flex="none" />
      )}
      <Text fz="sm" truncate maw={200} title={username}>
        {username}
      </Text>
    </Group>
  );
}

export default PersonName;
