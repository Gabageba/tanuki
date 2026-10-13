import { Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import useNewChapterBookmarks from '../hooks/useNewChapterBookmarks';
import HomeBlockHeading from './HomeBlockHeading';
import NewChapterBookmarksList from './NewChapterBookmarksList';
import NewChapterBookmarksSkeleton from './NewChapterBookmarksSkeleton';

/**
 * «Новые главы в закладках» — списком в две колонки на десктопе и в одну на телефоне: форма
 * нарочно не лента, чтобы не путаться с «Продолжить чтение». Заголовок есть всегда, под ним —
 * скелетон строк, затем список или пустое состояние.
 */
function NewChapterBookmarks() {
  const { t } = useTranslation();
  const { data, isPending } = useNewChapterBookmarks();

  return (
    <Stack gap="sm">
      <HomeBlockHeading
        title={t('newChaptersInBookmarks')}
        link={{ label: t('allBookmarks'), to: ROUTE_PATHS.BOOKMARKS }}
      />
      {isPending ? (
        <NewChapterBookmarksSkeleton />
      ) : (
        <NewChapterBookmarksList items={data?.items ?? []} />
      )}
    </Stack>
  );
}

export default NewChapterBookmarks;
