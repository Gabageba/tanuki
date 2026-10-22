import { Group, Paper, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import useDownloadSimulation from '../../hooks/useDownloadSimulation';
import { getPlateStateFromChapters } from '../../lib';
import { CHAPTER_ROWS, FREE_SPACE_MB } from '../../mocks';
import { CHAPTER_ICON, MODAL_PICKER, type ChapterTint } from '../../models';
import ChapterRowMock from '../ChapterRowMock';
import ChaptersToolbarMock from '../ChaptersToolbarMock';
import DownloadChaptersForm from '../DownloadChaptersForm';
import PlateCard from '../PlateCard';
import TitleActionsMock from '../TitleActionsMock';

type Props = {
  tint: ChapterTint;
};

/** Итог на странице тайтла: список глав C2 с цветом, карточка B3 по состоянию этих же глав и
 *  «Скачать все» с модалкой M2. */
function FinalTitlePage({ tint }: Props) {
  const { chapters, handleAction } = useDownloadSimulation(CHAPTER_ROWS);
  const [isModalOpened, { open, close }] = useDisclosure(false);
  const plateState = getPlateStateFromChapters(chapters);

  return (
    <Group align="flex-start" gap="xl" wrap="wrap">
      <TitleActionsMock>{plateState && <PlateCard state={plateState} />}</TitleActionsMock>
      <Stack gap="sm" flex={1} miw={320} maw={640}>
        <ChaptersToolbarMock onDownloadAll={open} />
        <Paper withBorder radius="md" p={4}>
          {chapters.map((chapter) => (
            <ChapterRowMock
              key={chapter.id}
              chapter={chapter}
              variant={CHAPTER_ICON.COUNTER}
              tint={tint}
              onAction={(action) => handleAction(chapter.id, action)}
            />
          ))}
        </Paper>
      </Stack>
      <ToneModal
        tone={MODAL_TONE.NEUTRAL}
        icon={DownloadSimpleIcon}
        opened={isModalOpened}
        onClose={close}
        title="Скачать главы"
      >
        <DownloadChaptersForm picker={MODAL_PICKER.RADIO} freeMb={FREE_SPACE_MB} onClose={close} />
      </ToneModal>
    </Group>
  );
}

export default FinalTitlePage;
