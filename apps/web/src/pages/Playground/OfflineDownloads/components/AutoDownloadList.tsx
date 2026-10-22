import { useState, type ReactNode } from 'react';
import { Switch } from '@mantine/core';
import { BookmarksIcon, BroomIcon, FolderIcon } from '@phosphor-icons/react';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import GroupedList from '@/shared/ui/GroupedList';

const FOLDERS = ['Читаю', 'В планах', 'Любимое', 'Отложено'];

type Props = {
  label: string;
  /** Строки после автоматических — S1 кладёт сюда объём. */
  children?: ReactNode;
  /** S2a — поле папок на всю ширину строки. */
  isWide?: boolean;
};

/** Блок вкладки «Загрузки» со строками «Скачивать новые главы» и «Удалять прочитанные главы». */
function AutoDownloadList({ label, children, isWide = false }: Props) {
  const [folders, setFolders] = useState<string[]>(['Читаю']);
  const [isAutoDelete, setIsAutoDelete] = useState(true);

  return (
    <GroupedList label={label}>
      <GroupedList.Row
        icon={<BookmarksIcon />}
        title="Скачивать новые главы"
        description={
          folders.length > 0
            ? 'Новые главы тайтлов из этих папок встают в очередь, пока приложение открыто'
            : 'Выключено — выберите папки закладок'
        }
      >
        <CompactMultiSelect
          value={folders}
          onChange={setFolders}
          data={FOLDERS}
          leftSection={<FolderIcon />}
          placeholder="Папки закладок"
          clearable
          maw={isWide ? undefined : 320}
        />
      </GroupedList.Row>
      <GroupedList.Row
        icon={<BroomIcon />}
        title="Удалять прочитанные главы"
        description="Скачанная глава удаляется, когда ваша отметка прогресса уходит дальше неё"
        isActionCompact
        action={
          <Switch
            checked={isAutoDelete}
            onChange={(event) => setIsAutoDelete(event.currentTarget.checked)}
            aria-label="Удалять прочитанные главы"
          />
        }
      />
      {children}
    </GroupedList>
  );
}

export default AutoDownloadList;
