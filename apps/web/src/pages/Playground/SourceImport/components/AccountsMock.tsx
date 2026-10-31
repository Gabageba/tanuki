import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { CheckCircleIcon, SignInIcon, UserCircleIcon } from '@phosphor-icons/react';
import { SOURCE_ID } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { PRIMARY_COLOR, STATUS_OK_COLOR } from '@/shared/lib/palette';
import GroupedList from '@/shared/ui/GroupedList';
import type { HeaderButton } from '../models';
import AccountActions from './AccountActions';

type Props = {
  button: HeaderButton;
  isPhone?: boolean;
};

const LIBSOCIAL = [
  { id: SOURCE_ID.MANGALIB, title: 'MangaLib', domain: 'mangalib.me' },
  { id: SOURCE_ID.HENTAILIB, title: 'HentaiLib', domain: 'hentailib.me' },
  { id: SOURCE_ID.YAOILIB, title: 'SlashLib', domain: 'slashlib.me' },
];

const GROUPLE = [
  { id: SOURCE_ID.READMANGA_RU, title: 'ReadManga', domain: 'readmanga.io' },
  { id: SOURCE_ID.MINTMANGA, title: 'MintManga', domain: 'mintmanga.live' },
];

/** Вкладка «Аккаунты источников» в две сети: вошедшая — с кнопкой импорта, рядом невошедшая с
 *  «Войти», чтобы видеть, не спорят ли кнопки. */
function AccountsMock({ button, isPhone = false }: Props) {
  return (
    <Paper withBorder radius="md" p="md" w={isPhone ? 375 : 620} maw="100%">
      <Stack gap="lg">
        <GroupedList label="LibSocial">
          <GroupedList.Header
            color={STATUS_OK_COLOR}
            icon={<CheckCircleIcon />}
            title="Вход выполнен"
            description="gabageba"
            action={<AccountActions button={button} isPhone={isPhone} />}
          />
          {LIBSOCIAL.map((source) => (
            <GroupedList.Row
              key={source.id}
              icon={<SourceIcon id={source.id} title={source.title} size={32} />}
              title={source.title}
              description={
                <Text fz={12} c="dimmed" ff="monospace" truncate>
                  {source.domain}
                </Text>
              }
            />
          ))}
        </GroupedList>
        <GroupedList label="Grouple">
          <GroupedList.Header
            color={PRIMARY_COLOR}
            icon={<UserCircleIcon />}
            title="Аккаунт не привязан"
            description="Один вход для всех источников ниже"
            action={
              <Group w={isPhone ? '100%' : 'auto'}>
                <Button
                  size="xs"
                  flex={isPhone ? 1 : 'none'}
                  variant="muted"
                  color={PRIMARY_COLOR}
                  leftSection={<SignInIcon />}
                >
                  Войти
                </Button>
              </Group>
            }
          />
          {GROUPLE.map((source) => (
            <GroupedList.Row
              key={source.id}
              icon={<SourceIcon id={source.id} title={source.title} size={32} />}
              title={source.title}
              description={
                <Text fz={12} c="dimmed" ff="monospace" truncate>
                  {source.domain}
                </Text>
              }
            />
          ))}
        </GroupedList>
      </Stack>
    </Paper>
  );
}

export default AccountsMock;
