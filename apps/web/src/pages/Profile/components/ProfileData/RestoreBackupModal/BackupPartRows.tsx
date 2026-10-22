import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookmarksSimpleIcon,
  ChartBarIcon,
  FolderSimpleIcon,
  GearSixIcon,
  MapPinIcon,
} from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import NewCount from './NewCount';

/** Часть копии: сколько нового — справа, подробности — в описании через «·». */
export type BackupPart = {
  added: number;
  details: (string | false)[];
};

type Props = {
  label: string;
  bookmarks: BackupPart;
  folders: BackupPart;
  progress: BackupPart;
  chapterReads: BackupPart;
  settings: string;
  /** Строки после частей — «Пропущено» у итога. */
  children?: ReactNode;
};

/** Части копии строками — одни и те же у сводки и у итога, различаются только числами и словами. */
function BackupPartRows({
  label,
  bookmarks,
  folders,
  progress,
  chapterReads,
  settings,
  children,
}: Props) {
  const { t } = useTranslation();
  const rows = [
    { key: 'bookmarks', icon: <BookmarksSimpleIcon />, title: t('bookmarks'), part: bookmarks },
    { key: 'folders', icon: <FolderSimpleIcon />, title: t('folders'), part: folders },
    { key: 'progress', icon: <MapPinIcon />, title: t('whereLeftOff'), part: progress },
    {
      key: 'chapterReads',
      icon: <ChartBarIcon />,
      title: t('statistics'),
      part: chapterReads,
      isChapters: true,
    },
  ];

  return (
    <GroupedList label={label}>
      {rows.map(({ key, icon, title, part, isChapters }) => (
        <GroupedList.Row
          key={key}
          icon={icon}
          title={title}
          isActionCompact
          action={<NewCount value={part.added} isChapters={isChapters} />}
          description={<MidDotGroup items={part.details} />}
        />
      ))}
      <GroupedList.Row icon={<GearSixIcon />} title={t('settings')} description={settings} />
      {children}
    </GroupedList>
  );
}

export default BackupPartRows;
