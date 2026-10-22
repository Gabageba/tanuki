import { useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { CHAPTER_NUMBERING, type ChaptersResponse } from '@tanuki/contracts';
import useDownloadsTotal from '@/entities/download/hooks/useDownloadsTotal';
import type { DownloadRow } from '@/entities/download/models';
import { enqueueChapters } from '@/entities/download/queue';
import useTitleDetails from '@/entities/title/hooks/useTitleDetails';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import useStorageEstimate from '@/shared/hooks/useStorageEstimate';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import DownloadSummary from './DownloadSummary';
import { getAverageChapterBytes, isInRange, selectChaptersToDownload } from './lib';
import { DOWNLOAD_SCOPE, type DownloadChaptersFormValues, type DownloadScope } from './models';
import ScopeRadioCards from './ScopeRadioCards';

type Props = {
  opened: boolean;
  onClose: () => void;
  titleId: string;
  /** Ключ запроса списка (id ветки) и сам список — главы и снимок для работы без сети. */
  branchId: string;
  chaptersList: ChaptersResponse;
  downloads: ReadonlyMap<string, DownloadRow> | undefined;
  ownChapterId: string | undefined;
};

const INITIAL_VALUES: DownloadChaptersFormValues = {
  scope: DOWNLOAD_SCOPE.UNREAD,
  from: '',
  to: '',
};

/** «Скачать главы» ветки (M2): все, непрочитанные или диапазон — в конец очереди по порядку чтения. */
function DownloadChaptersModal({
  opened,
  onClose,
  titleId,
  branchId,
  chaptersList,
  downloads,
  ownChapterId,
}: Props) {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const { data: details } = useTitleDetails({ titleId });
  const { data: storage } = useStorageEstimate();
  const total = useDownloadsTotal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Сервер отдаёт главы от новых к старым, очередь идёт по порядку чтения.
  const chapters = [...chaptersList.items].reverse();
  // Номера в нумерации по томам повторяются, диапазон по ним захватил бы главы из каждого тома.
  const scopes = Object.values(DOWNLOAD_SCOPE).filter(
    (scope) =>
      scope !== DOWNLOAD_SCOPE.RANGE || chaptersList.numbering !== CHAPTER_NUMBERING.PER_VOLUME,
  );
  const select = (values: DownloadChaptersFormValues) =>
    selectChaptersToDownload({ values, chapters, ownChapterId, downloads });

  const form = useForm<DownloadChaptersFormValues>({
    initialValues: INITIAL_VALUES,
    validate: (values) => {
      const field = values.scope === DOWNLOAD_SCOPE.RANGE ? 'to' : 'scope';
      if (values.scope === DOWNLOAD_SCOPE.RANGE) {
        const { from, to } = values;
        if (from === '' || to === '') return { to: t('specifyFromAndToChapter') };
        if (from > to) return { to: t('lastChapterBeforeFirst') };
        if (!chapters.some((chapter) => isInRange(chapter, from, to))) {
          return { to: t('noChaptersInRange') };
        }
      }
      return select(values).length === 0 ? { [field]: t('allSelectedChaptersAlreadyQueued') } : {};
    },
  });

  const count = select(form.values).length;
  const getCount = (scope: DownloadScope) => select({ ...form.values, scope }).length;

  const handleClose = () => {
    onClose();
    form.reset();
  };

  const handleSubmit = async (values: DownloadChaptersFormValues) => {
    if (!user || !details) return;
    setIsSubmitting(true);
    try {
      await enqueueChapters({
        userId: user.id,
        details,
        chapters: select(values),
        numbering: chaptersList.numbering,
        chaptersList,
        chaptersListKey: branchId,
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={DownloadSimpleIcon}
      opened={opened}
      onClose={handleClose}
      title={t('downloadChapters')}
    >
      <form onSubmit={form.onSubmit((values) => void handleSubmit(values))}>
        <Stack gap="md">
          <Stack gap={6}>
            <Text fz="sm">{t('chaptersWillQueueInReadingOrder')}</Text>
            <Text c="dimmed" fz={13}>
              {t('queuedChaptersWontBeAddedAgain')}
            </Text>
          </Stack>
          <ScopeRadioCards form={form} scopes={scopes} getCount={getCount} />
          <DownloadSummary
            count={count}
            neededBytes={count * getAverageChapterBytes(total)}
            freeBytes={storage ? storage.free : null}
          />
          <ModalButtonsLayout>
            <Button variant="default" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              leftSection={<DownloadSimpleIcon />}
              loading={isSubmitting}
              disabled={!details}
            >
              {t('downloadChapters')}
            </Button>
          </ModalButtonsLayout>
        </Stack>
      </form>
    </ToneModal>
  );
}

export default DownloadChaptersModal;
