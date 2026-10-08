import { Box, Select, Switch } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  ArrowsHorizontalIcon,
  ArrowsOutLineHorizontalIcon,
  ArrowsOutLineVerticalIcon,
  ArrowsVerticalIcon,
  BookOpenIcon,
  EyeClosedIcon,
  HandTapIcon,
  MagnifyingGlassPlusIcon,
  RowsIcon,
  SkipForwardIcon,
  SplitVerticalIcon,
} from '@phosphor-icons/react';
import {
  READER_CHAPTER_GAP,
  READER_CONTAINER_WIDTH,
  READER_PAGE_FIT,
  READER_PAGE_GAP,
  READER_READING_MODE,
  READER_TAP_ZONE_WIDTH,
  type ReaderPageFit,
  type ReaderReadingMode,
  type ReaderSettings,
} from '@tanuki/contracts';
import useReaderSettings from '@/entities/reader/hooks/useReaderSettings';
import useUpdateReaderSettings from '@/entities/reader/hooks/useUpdateReaderSettings';
import ReaderTapZonePreview from '@/entities/reader/ReaderTapZonePreview';
import GroupedList from '@/shared/ui/GroupedList';
import { getReaderPresets } from './lib';
import ReaderSliderRow from './ReaderSliderRow';
import SettingsReaderSkeleton from './SettingsReaderSkeleton';
import styles from './SettingsReader.module.scss';

function SettingsReader() {
  const { t } = useTranslation();
  const { data: settings, isPending } = useReaderSettings();
  const updateSettings = useUpdateReaderSettings();

  if (isPending) {
    return <SettingsReaderSkeleton />;
  }

  if (!settings) return null;

  const update = (patch: Partial<ReaderSettings>) =>
    updateSettings.mutate({ ...settings, ...patch });

  const isHorizontal = settings.readingMode === READER_READING_MODE.HORIZONTAL;
  const isFitWidth = settings.pageFit === READER_PAGE_FIT.FIT_WIDTH;

  const readingModeOptions = [
    {
      value: READER_READING_MODE.VERTICAL,
      label: t('vertical'),
      description: t('pagesInStripTurnedByScrolling'),
      icon: <ArrowsVerticalIcon />,
    },
    {
      value: READER_READING_MODE.HORIZONTAL,
      label: t('horizontal'),
      description: t('onePageAtTimeTurnedByClickOrArrows'),
      icon: <ArrowsHorizontalIcon />,
    },
  ];
  const readingMode = readingModeOptions.find(({ value }) => value === settings.readingMode);

  const pageFitOptions = [
    {
      value: READER_PAGE_FIT.FIT_WIDTH,
      label: t('byWidth'),
      description: t('pageFullContainerWidthHeightFollows'),
      icon: <ArrowsOutLineHorizontalIcon />,
    },
    {
      value: READER_PAGE_FIT.FIT_HEIGHT,
      label: t('whole'),
      description: t('heightFitsScreenFully'),
      icon: <ArrowsOutLineVerticalIcon />,
    },
  ];
  const pageFit = pageFitOptions.find(({ value }) => value === settings.pageFit);

  return (
    <Box className={styles.grid}>
      <GroupedList label={t('display')}>
        <GroupedList.Row
          icon={<BookOpenIcon />}
          title={t('readingMode')}
          description={readingMode?.description}
          action={
            <Select
              data={readingModeOptions}
              value={settings.readingMode}
              onChange={(value) => value && update({ readingMode: value as ReaderReadingMode })}
              leftSection={readingMode?.icon}
              allowDeselect={false}
            />
          }
        />
        <GroupedList.Row
          icon={<MagnifyingGlassPlusIcon />}
          title={t('pageScale')}
          description={pageFit?.description}
          action={
            <Select
              data={pageFitOptions}
              value={settings.pageFit}
              onChange={(value) => value && update({ pageFit: value as ReaderPageFit })}
              leftSection={pageFit?.icon}
              allowDeselect={false}
            />
          }
        />
        <ReaderSliderRow
          icon={<ArrowsOutLineHorizontalIcon />}
          title={t('containerWidth')}
          description={isFitWidth ? t('pageStripWidthOnWideScreen') : t('onlyWithByWidthScale')}
          unit="px"
          value={settings.containerWidth}
          range={READER_CONTAINER_WIDTH}
          presets={getReaderPresets(READER_CONTAINER_WIDTH, t)}
          onChange={(containerWidth) => update({ containerWidth })}
          disabled={!isFitWidth}
        />
      </GroupedList>

      <Box className={styles.spacing}>
        <GroupedList label={t('gapsAndClickZone')}>
          <ReaderSliderRow
            icon={<HandTapIcon />}
            title={t('clickArea')}
            description={isHorizontal ? t('screenEdgesClickTurnsPage') : t('onlyInHorizontalMode')}
            unit="%"
            value={settings.tapZoneWidth}
            range={READER_TAP_ZONE_WIDTH}
            presets={getReaderPresets(READER_TAP_ZONE_WIDTH, t)}
            preview={<ReaderTapZonePreview tapZoneWidth={settings.tapZoneWidth} />}
            onChange={(tapZoneWidth) => update({ tapZoneWidth })}
            disabled={!isHorizontal}
          />
          <ReaderSliderRow
            icon={<RowsIcon />}
            title={t('gapBetweenPages')}
            description={isHorizontal ? t('onlyInVerticalMode') : t('spaceBetweenPagesInStrip')}
            unit="px"
            value={settings.pageGap}
            range={READER_PAGE_GAP}
            presets={getReaderPresets(READER_PAGE_GAP, t)}
            onChange={(pageGap) => update({ pageGap })}
            disabled={isHorizontal}
          />
          <ReaderSliderRow
            icon={<SplitVerticalIcon />}
            title={t('gapBetweenChapters')}
            description={isHorizontal ? t('onlyInVerticalMode') : t('breakInStripWhereChapterEnds')}
            unit="px"
            value={settings.chapterGap}
            range={READER_CHAPTER_GAP}
            presets={getReaderPresets(READER_CHAPTER_GAP, t)}
            onChange={(chapterGap) => update({ chapterGap })}
            disabled={isHorizontal}
          />
        </GroupedList>
      </Box>

      <Box className={styles.behavior}>
        <GroupedList label={t('behavior')}>
          <GroupedList.Row
            icon={<SkipForwardIcon />}
            title={t('openNextChapterImmediately')}
            description={
              settings.autoNextChapter
                ? t('finishedChapterContinuesWithNext')
                : t('screenWithNextChapterAtEnd')
            }
            action={
              <Switch
                checked={settings.autoNextChapter}
                onChange={(event) => update({ autoNextChapter: event.currentTarget.checked })}
              />
            }
          />
          <GroupedList.Row
            icon={<EyeClosedIcon />}
            title={t('hidePanelsOnScroll')}
            description={
              settings.hidePanelsOnScroll
                ? t('headerAndChapterBarSlideAwayWhileReading')
                : t('onlyPageTapHidesAndShowsPanels')
            }
            action={
              <Switch
                checked={settings.hidePanelsOnScroll}
                onChange={(event) => update({ hidePanelsOnScroll: event.currentTarget.checked })}
              />
            }
          />
        </GroupedList>
      </Box>
    </Box>
  );
}

export default SettingsReader;
