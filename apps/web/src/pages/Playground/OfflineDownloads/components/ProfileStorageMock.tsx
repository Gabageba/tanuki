import { ActionIcon, Anchor, Group, Text } from '@mantine/core';
import { BroomIcon, CaretRightIcon, TrashIcon, TrayArrowDownIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import GroupedList from '@/shared/ui/GroupedList';
import type { RowProps } from '@/shared/ui/GroupedList/models';
import { PROFILE_ROW, type ProfileRow } from '../models';
import DownloadedTotal from './DownloadedTotal';

type Props = {
  variant: ProfileRow;
  hasDownloads: boolean;
  onDelete: () => void;
};

/** Блок «Хранилище» в «Профиль → Данные»: очистка кеша и скачанные главы по варианту оси P. */
function ProfileStorageMock({ variant, hasDownloads, onDelete }: Props) {
  const deleteAction: RowProps['actionProps'] = {
    color: 'red',
    variant: 'muted',
    leftSection: <TrashIcon />,
    onClick: onDelete,
    children: 'Удалить',
    disabled: !hasDownloads || variant === PROFILE_ROW.LEGACY,
  };

  return (
    <GroupedList label="Хранилище">
      <GroupedList.Row
        icon={<BroomIcon />}
        title="Очистить кеш браузера"
        description="Сбросит сохранённые данные страниц и перезагрузит приложение"
        actionProps={{
          color: 'red',
          variant: 'muted',
          leftSection: <BroomIcon />,
          children: 'Очистить',
        }}
      />
      {variant === PROFILE_ROW.LEGACY && (
        <GroupedList.Row
          icon={<TrashIcon />}
          title="Удалить скачанные главы"
          description={
            <Text fz="sm" c="dimmed" ff="monospace">
              Занято 2,4 ГБ из 64 ГБ
            </Text>
          }
          actionProps={deleteAction}
        />
      )}
      {variant === PROFILE_ROW.SINGLE && (
        <GroupedList.Row
          icon={<TrashIcon />}
          title="Удалить скачанные главы"
          description={
            <Group gap={6}>
              <DownloadedTotal hasDownloads={hasDownloads} />
              {hasDownloads && (
                <Anchor component={Link} to="#" fz={12}>
                  Загрузки
                </Anchor>
              )}
            </Group>
          }
          actionProps={deleteAction}
        />
      )}
      {variant === PROFILE_ROW.SPLIT && (
        <GroupedList.Row
          icon={<TrayArrowDownIcon />}
          title="Загрузки"
          description={<DownloadedTotal hasDownloads={hasDownloads} />}
          isActionCompact
          action={
            <ActionIcon
              component={Link}
              to="#"
              variant="subtle"
              color="gray"
              aria-label="Открыть загрузки"
            >
              <CaretRightIcon />
            </ActionIcon>
          }
        />
      )}
      {variant === PROFILE_ROW.SPLIT && (
        <GroupedList.Row
          icon={<TrashIcon />}
          title="Удалить скачанные главы"
          description="Без сети их будет не прочитать, пока не скачаете заново"
          actionProps={deleteAction}
          disabled={!hasDownloads}
        />
      )}
    </GroupedList>
  );
}

export default ProfileStorageMock;
