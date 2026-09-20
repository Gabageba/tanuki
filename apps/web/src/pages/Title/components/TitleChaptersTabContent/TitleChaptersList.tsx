import { Card, EmptyState, NavLink, ScrollArea, Tabs } from '@mantine/core';
import { generatePath, Link, useSearchParams } from 'react-router';
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EmptyIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { SORT_DIRECTION, SortDirectionSchema, type Branch } from '@tanuki/contracts';
import useChapters from '../../hooks/useChapters';
import { ROUTE_PATHS } from '@/shared/consts/routes';
import TitleChapterItem from './TitleChapterItem';
import TitleChapterListSkeleton from './TitleChapterListSkeleton';
import styles from './TitleChaptersTabContent.module.scss';

const CHAPTER_ESTIMATED_SIZE = 64;

type Props = {
  titleId: string;
  branch: Branch;
};

function TitleChaptersList({ titleId, branch }: Props) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const viewportRef = useRef<HTMLDivElement>(null);
  const { data: chaptersData, isPending: isChaptersPending } = useChapters({
    titleId,
    branch: branch.id,
  });

  const parsedDirection = SortDirectionSchema.safeParse(searchParams.get('direction'));
  const direction = parsedDirection.success ? parsedDirection.data : SORT_DIRECTION.DESC;

  const chapters =
    direction === SORT_DIRECTION.DESC
      ? [...(chaptersData?.items ?? [])].reverse()
      : (chaptersData?.items ?? []);

  const virtualizer = useVirtualizer({
    count: chapters.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => CHAPTER_ESTIMATED_SIZE,
    overscan: 8,
  });

  if (isChaptersPending) {
    return <TitleChapterListSkeleton />;
  }

  if (chapters.length === 0) {
    return (
      <Tabs.Panel value={branch.id}>
        <Card withBorder p={0} bg="transparent">
          <EmptyState
            description={t('branchHasNoChaptersYet')}
            size="sm"
            icon={<EmptyIcon />}
            py="xs"
          />
        </Card>
      </Tabs.Panel>
    );
  }

  return (
    <Tabs.Panel value={branch.id}>
      <Card withBorder p={0} bg="transparent">
        <ScrollArea.Autosize mah="70vh" type="auto" viewportRef={viewportRef}>
          <div style={{ position: 'relative', height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const chapter = chapters[virtualItem.index];
              if (!chapter) {
                return null;
              }

              return (
                <div
                  key={chapter.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <NavLink
                    className={styles.chapter}
                    data-last={virtualItem.index === chapters.length - 1 || undefined}
                    component={Link}
                    to={generatePath(ROUTE_PATHS.READER, { titleId, chapterId: chapter.id })}
                    label={<TitleChapterItem chapter={chapter} />}
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea.Autosize>
      </Card>
    </Tabs.Panel>
  );
}

export default TitleChaptersList;
