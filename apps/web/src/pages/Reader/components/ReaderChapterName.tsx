import { Button, Drawer, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import type { Chapter } from '@tanuki/contracts';
import { isEmpty } from '@/shared/lib/isEmpty';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import ChaptersList from '@/shared/ui/ChaptersList';
import { XXS_QUERY } from '@/shared/lib/breakpoints';

type Props = {
  chapters: Chapter[];
  currentChapter: Chapter;
  titleId: string;
};

function ReaderChapterName({ chapters, currentChapter, titleId }: Props) {
  const { t } = useTranslation();
  const isXxs = useMediaQuery(XXS_QUERY, false);

  const [isDrawerOpened, setIsDrawerOpened] = useState(false);

  return (
    <>
      <Button variant="subtle" color="gray" miw={0} onClick={() => setIsDrawerOpened(true)}>
        <MidDotGroup
          truncate
          items={[
            !isEmpty(currentChapter.number) &&
              t('chapterNumberAbbrev', { number: currentChapter.number }),
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
          titleId={titleId}
          activeChapterId={currentChapter.id}
          onChapterSelect={() => setIsDrawerOpened(false)}
        />
      </Drawer>
    </>
  );
}

export default ReaderChapterName;
