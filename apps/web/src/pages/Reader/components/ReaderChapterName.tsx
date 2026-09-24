import { Button, Drawer, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import type { Chapter, ChapterNumbering } from '@tanuki/contracts';
import { isEmpty } from '@/shared/lib/isEmpty';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import ChaptersList from '@/shared/ui/ChaptersList';
import { XXS_QUERY } from '@/shared/lib/breakpoints';
import useReadingProgress from '@/entities/title/hooks/useReadingProgress';
import useUpdateReadingProgress from '@/entities/title/hooks/useUpdateReadingProgress';
import {
  getChapterBranchId,
  getChapterNumberLabel,
  resolveLinkedMarks,
  resolveOwnMark,
} from '@/entities/title/readingProgress';

type Props = {
  chapters: Chapter[];
  numbering: ChapterNumbering;
  currentChapter: Chapter;
  titleId: string;
};

function ReaderChapterName({ chapters, numbering, currentChapter, titleId }: Props) {
  const { t } = useTranslation();
  const isXxs = useMediaQuery(XXS_QUERY, false);

  const [isDrawerOpened, setIsDrawerOpened] = useState(false);
  const { data: progress } = useReadingProgress({ titleId });
  const { mutate: updateProgress } = useUpdateReadingProgress({ titleId });

  return (
    <>
      <Button variant="subtle" color="gray" miw={0} onClick={() => setIsDrawerOpened(true)}>
        <MidDotGroup
          truncate
          items={[
            !isEmpty(currentChapter.number) && getChapterNumberLabel(currentChapter, numbering, t),
            currentChapter.title,
          ]}
        />
      </Button>
      <Drawer
        opened={isDrawerOpened}
        onClose={() => setIsDrawerOpened(false)}
        display="flex"
        styles={{
          content: { flexDirection: 'column' },
          body: { flex: 1, minHeight: 0 },
        }}
        title={
          <Group gap={8} align="flex-end">
            {t('chapters')}
            <Text fz={13} lh={1} c="dimmed">
              {chapters.length}
            </Text>
          </Group>
        }
      >
        <ChaptersList
          showDate={isXxs}
          chapters={chapters}
          numbering={numbering}
          titleId={titleId}
          activeChapterId={currentChapter.id}
          onChapterSelect={() => setIsDrawerOpened(false)}
          ownMark={resolveOwnMark(progress, chapters, numbering)}
          linkedMarks={resolveLinkedMarks(progress, chapters, getChapterBranchId(currentChapter))}
          onMarkChapter={(chapter) =>
            updateProgress({ chapterId: chapter.id, pageIndex: 0, chapter })
          }
        />
      </Drawer>
    </>
  );
}

export default ReaderChapterName;
