import type { Meta, StoryObj } from '@storybook/react-vite';
import { screen, userEvent } from 'storybook/test';
import { DEFAULT_BRANCH_ID } from '@tanuki/contracts';
import { I18N } from '@/shared/lib/i18n';
import { DOWNLOADS_SEED, TITLE_DOWNLOADS } from '@/shared/storybook/downloads';
import ModalStage from '@/shared/storybook/ModalStage';
import { CHAPTERS_RESPONSE, READING_CHAPTER, TITLE } from '@/shared/storybook/titles';
import DownloadChaptersModal from '.';

const META = {
  title: 'Модалки/Тайтл/DownloadChaptersModal',
  render: () => (
    <ModalStage>
      {({ opened, close }) => (
        <DownloadChaptersModal
          opened={opened}
          onClose={close}
          titleId={TITLE.id}
          branchId={DEFAULT_BRANCH_ID}
          chaptersList={CHAPTERS_RESPONSE}
          downloads={TITLE_DOWNLOADS}
          ownChapterId={READING_CHAPTER.id}
        />
      )}
    </ModalStage>
  ),
  // Средний размер главы для оценки места берётся из уже скачанного.
  parameters: { offlineDb: DOWNLOADS_SEED },
} satisfies Meta;

export default META;

type Story = StoryObj<typeof META>;

export const Default: Story = {
  name: 'Скачать главы',
};

export const Range: Story = {
  name: 'Диапазон',
  play: async () => userEvent.click(await screen.findByRole('radio', { name: I18N.t('range') })),
};

export const RangeError: Story = {
  name: 'Диапазон без номеров',
  play: async () => {
    await userEvent.click(await screen.findByRole('radio', { name: I18N.t('range') }));
    await userEvent.click(screen.getByRole('button', { name: I18N.t('downloadChapters') }));
  },
};
