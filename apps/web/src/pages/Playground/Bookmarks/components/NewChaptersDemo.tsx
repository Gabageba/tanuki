import { Group, Paper, Stack } from '@mantine/core';
import { MOCK_CHAPTERS } from '../mocks';
import type { NewChapterVariant } from '../models';
import NewChapterRow from './NewChapterRow';
import PhoneFrame from './PhoneFrame';

type Props = {
  /** null — пометки нет, как сейчас. */
  variant: NewChapterVariant | null;
};

/** Список глав «сначала новые»: три новые сверху, своя отметка на 1090. */
function NewChaptersDemo({ variant }: Props) {
  const rows = MOCK_CHAPTERS.map((chapter, index) => (
    <NewChapterRow
      key={chapter.number}
      chapter={chapter}
      variant={variant}
      isFirst={index === 0}
      isLast={index === MOCK_CHAPTERS.length - 1}
    />
  ));

  return (
    <Group gap="xl" align="flex-start">
      <Paper withBorder radius="md" w={620} maw="100%">
        <Stack gap={0}>{rows}</Stack>
      </Paper>
      <PhoneFrame>
        <Stack gap={0}>{rows}</Stack>
      </PhoneFrame>
    </Group>
  );
}

export default NewChaptersDemo;
