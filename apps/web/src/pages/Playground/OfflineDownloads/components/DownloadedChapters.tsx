import { useState } from 'react';
import { Stack } from '@mantine/core';
import type { MockChapter } from '../models';
import DownloadedChapterRow from './DownloadedChapterRow';

type Props = {
  chapters: MockChapter[];
};

/** Главы скачанного тайтла; удаление одной главы — сразу, без модалки. */
function DownloadedChapters({ chapters: initialChapters }: Props) {
  const [chapters, setChapters] = useState(initialChapters);

  return (
    <Stack gap={0}>
      {chapters.map((chapter) => (
        <DownloadedChapterRow
          key={chapter.id}
          chapter={chapter}
          onDelete={() =>
            setChapters((current) => current.filter((entry) => entry.id !== chapter.id))
          }
        />
      ))}
    </Stack>
  );
}

export default DownloadedChapters;
