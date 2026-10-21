import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import PageLayout from '@/shared/ui/PageLayout';
import type useHomeQueries from '../hooks/useHomeQueries';
import HomeBlock from './HomeBlock';
import QueryBlock from '@/shared/ui/QueryBlock';
import NewChapterBookmarksEmpty from './NewChapterBookmarksEmpty';
import NewChapterBookmarksList from './NewChapterBookmarksList';
import NewChapterBookmarksSkeleton from './NewChapterBookmarksSkeleton';

/**
 * «Новые главы в закладках» — списком в две колонки на десктопе и в одну на телефоне: форма
 * нарочно не лента, чтобы не путаться с «Продолжить чтение». Заголовок есть всегда, под ним —
 * скелетон строк, затем список или пустое состояние.
 */
function NewChapterBookmarks() {
  const { t } = useTranslation();
  const { newChapterBookmarks } = PageLayout.useQueries<typeof useHomeQueries>();

  return (
    <HomeBlock
      title={t('newChaptersInBookmarks')}
      link={{ label: t('allBookmarks'), to: ROUTE_PATHS.BOOKMARKS }}
    >
      <QueryBlock
        query={newChapterBookmarks}
        skeleton={<NewChapterBookmarksSkeleton />}
        empty={<NewChapterBookmarksEmpty />}
      >
        {(data) => <NewChapterBookmarksList items={data.items} />}
      </QueryBlock>
    </HomeBlock>
  );
}

export default NewChapterBookmarks;
