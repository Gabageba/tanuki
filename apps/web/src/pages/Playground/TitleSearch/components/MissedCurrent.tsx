import { Badge, Button, Group, Stack, Title } from '@mantine/core';
import { Link } from 'react-router';
import { SignInIcon } from '@phosphor-icons/react';
import { SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';
import { MOCK_GROUP_STATUS, type MissedGroup } from '../models';

type Props = {
  missed: MissedGroup[];
};

/** N0 — как сейчас: секция на каждый источник с бейджем статуса; `unavailable` не видно вовсе. */
function MissedCurrent({ missed }: Props) {
  const visible = missed.filter(({ status }) => status !== MOCK_GROUP_STATUS.UNAVAILABLE);

  return (
    <Stack gap="xl">
      {visible.map(({ source, status }) => (
        <Group key={source.id} gap="xs">
          <Title order={3}>{source.title}</Title>
          {status === MOCK_GROUP_STATUS.TIMEOUT && (
            <Badge color="yellow" variant="light">
              Не успел ответить
            </Badge>
          )}
          {status === MOCK_GROUP_STATUS.ERROR && (
            <Badge color="red" variant="light">
              Ошибка
            </Badge>
          )}
          {status === MOCK_GROUP_STATUS.LOCKED && (
            <>
              <Badge color="gray" variant="light">
                Нужен вход
              </Badge>
              <Button
                component={Link}
                to={SOURCE_ACCOUNTS_PATH}
                variant="subtle"
                size="compact-sm"
                leftSection={<SignInIcon />}
              >
                Войти
              </Button>
            </>
          )}
        </Group>
      ))}
    </Stack>
  );
}

export default MissedCurrent;
