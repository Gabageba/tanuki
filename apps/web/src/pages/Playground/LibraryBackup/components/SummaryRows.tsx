import {
  BookmarksSimpleIcon,
  ChartBarIcon,
  FolderSimpleIcon,
  GearSixIcon,
  MapPinIcon,
} from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { formatCount, joinParts, pluralize } from '../lib';
import type { BackupPreview } from '../models';
import NewCount from './NewCount';

type Props = {
  preview: BackupPreview;
};

/** S1 — части копии строками `GroupedList`: новых — справа, остальное — в описании строки. */
function SummaryRows({ preview }: Props) {
  const { bookmarks, folders, progress, chapterReads } = preview;

  return (
    <GroupedList label="Что в копии">
      <GroupedList.Row
        icon={<BookmarksSimpleIcon />}
        title="Закладки"
        isActionCompact
        action={<NewCount value={bookmarks.added} />}
        description={joinParts([
          bookmarks.sameFolder > 0 && `${formatCount(bookmarks.sameFolder)} уже в закладках`,
          bookmarks.otherFolder > 0 && `${formatCount(bookmarks.otherFolder)} в другой папке`,
          bookmarks.skipped > 0 &&
            `${formatCount(bookmarks.skipped)} ${pluralize(bookmarks.skipped, { one: 'пропущена', few: 'пропущены', many: 'пропущено' })} — источников нет на этом инстансе`,
        ])}
      />
      <GroupedList.Row
        icon={<FolderSimpleIcon />}
        title="Папки"
        isActionCompact
        action={<NewCount value={folders.added} />}
        description={joinParts([
          folders.matched > 0 &&
            `${formatCount(folders.matched)} ${pluralize(folders.matched, { one: 'совпала', few: 'совпали', many: 'совпали' })} по имени`,
          folders.overLimit > 0 &&
            `${formatCount(folders.overLimit)} не ${pluralize(folders.overLimit, { one: 'поместится', few: 'поместятся', many: 'поместятся' })} — их тайтлы лягут в «В планах»`,
        ])}
      />
      <GroupedList.Row
        icon={<MapPinIcon />}
        title="Где остановился"
        isActionCompact
        action={<NewCount value={progress.added} />}
        description={joinParts([
          progress.differs > 0 &&
            `${formatCount(progress.differs)} ${pluralize(progress.differs, { one: 'расходится', few: 'расходятся', many: 'расходятся' })} с вашими`,
        ])}
      />
      <GroupedList.Row
        icon={<ChartBarIcon />}
        title="Статистика"
        isActionCompact
        action={<NewCount value={chapterReads} unit="гл." />}
        description={chapterReads > 0 ? 'Прочитанные главы и время чтения' : 'Всё уже в статистике'}
      />
      <GroupedList.Row
        icon={<GearSixIcon />}
        title="Настройки"
        description="Общие, читалка и источники — если включить ниже"
      />
    </GroupedList>
  );
}

export default SummaryRows;
