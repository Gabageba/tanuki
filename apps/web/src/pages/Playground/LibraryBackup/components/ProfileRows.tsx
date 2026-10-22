import { Box } from '@mantine/core';
import { CloudArrowDownIcon, DownloadSimpleIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { PROFILE_STATE, PROFILE_VIEW, type ProfileState, type ProfileView } from '../models';

type Props = {
  view: ProfileView;
  state: ProfileState;
  w?: number;
};

const getBackupDescription = (view: ProfileView, state: ProfileState) => {
  if (view !== PROFILE_VIEW.DATED || state === PROFILE_STATE.NEVER) {
    return 'Закладки, прогресс, статистика и настройки';
  }
  return 'Закладки, прогресс, статистика и настройки · последняя — 2 дня назад';
};

/** Блок «Импорт и экспорт» в «Профиль → Данные»: две строки задачи и неизменная «Импорт из
 *  источника». */
function ProfileRows({ view, state, w = 560 }: Props) {
  const isOffline = state === PROFILE_STATE.OFFLINE;
  const isDownloading = state === PROFILE_STATE.DOWNLOADING;

  return (
    <Box w={w} maw="100%">
      <GroupedList label="Импорт и экспорт">
        {view === PROFILE_VIEW.CURRENT ? (
          <GroupedList.Row
            icon={<DownloadSimpleIcon />}
            title="Экспорт закладок"
            description="Закладки, прогресс, оценки и история"
            actionProps={{ leftSection: <DownloadSimpleIcon />, children: 'Экспорт' }}
          />
        ) : (
          <GroupedList.Row
            icon={<DownloadSimpleIcon />}
            title="Создать резервную копию"
            description={getBackupDescription(view, state)}
            actionProps={{
              leftSection: <DownloadSimpleIcon />,
              loading: isDownloading,
              disabled: isOffline,
              children: 'Скачать копию',
            }}
          />
        )}
        {view === PROFILE_VIEW.CURRENT ? (
          <GroupedList.Row
            icon={<UploadSimpleIcon />}
            title="Импорт закладок"
            description="Импорт не перезаписывает прогресс — только добавляет тайтлы в закладки"
            actionProps={{ leftSection: <UploadSimpleIcon />, children: 'Импорт' }}
          />
        ) : (
          <GroupedList.Row
            icon={<UploadSimpleIcon />}
            title="Восстановить из копии"
            description="Добавляет к библиотеке, ничего не удаляя без спроса"
            actionProps={{
              leftSection: <UploadSimpleIcon />,
              disabled: isOffline,
              children: 'Восстановить',
            }}
          />
        )}
        <GroupedList.Row
          icon={<CloudArrowDownIcon />}
          title="Импорт из источника"
          description="Закладки из вашего аккаунта на источнике"
          actionProps={{ leftSection: <CloudArrowDownIcon />, children: 'Импорт' }}
        />
      </GroupedList>
    </Box>
  );
}

export default ProfileRows;
