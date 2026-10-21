import { Group, Text, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import FolderGlyph from '@/entities/bookmark/FolderGlyph';
import { getBookmarksFolderPath } from '@/shared/lib/routes';
import PageLayout from '@/shared/ui/PageLayout';
import ProgressList from '@/shared/ui/ProgressList';
import type useProfileQueries from '../../../hooks/useProfileQueries';
import ProfileStatisticCard from './ProfileStatisticCard';

/** Сколько тайтлов в каждой папке (G1); клик по папке открывает её на /bookmarks. Упавший
 *  запрос сообщает глобальный тост — карточки тогда просто нет. */
function BookmarksCard() {
  const { t } = useTranslation();
  const { data } = PageLayout.useQueries<typeof useProfileQueries>().bookmarkFolders;

  if (!data) return null;

  const total = data.items.reduce((sum, { count }) => sum + count, 0);

  return (
    <ProfileStatisticCard label={t('bookmarks')} extra={t('countTitles', { count: total })}>
      <ProgressList
        gap="sm"
        items={data.items.map((folder) => ({
          key: folder.id,
          label: (
            <UnstyledButton component={Link} to={getBookmarksFolderPath(folder.id)} maw="100%">
              <Group component="span" gap={8} wrap="nowrap">
                <FolderGlyph folder={folder} />
                <Text component="span" inherit truncate>
                  {folder.name}
                </Text>
              </Group>
            </UnstyledButton>
          ),
          value: folder.count,
          text: folder.count,
        }))}
      />
    </ProfileStatisticCard>
  );
}

export default BookmarksCard;
