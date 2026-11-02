import { Box, Select, Switch } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  ArrowsOutLineHorizontalIcon,
  BookOpenIcon,
  EyeClosedIcon,
  HandTapIcon,
  RowsIcon,
  SkipForwardIcon,
  SplitVerticalIcon,
  ArrowsLeftRightIcon,
  SunIcon,
  ImageIcon,
  EyeIcon,
} from '@phosphor-icons/react';
import {
  READER_CHAPTER_GAP,
  READER_BRIGHTNESS,
  READER_PREFETCH,
  type ReaderDirection,
  type ReaderPageLayout,
  READER_CONTAINER_WIDTH,
  READER_PAGE_FIT,
  READER_PAGE_GAP,
  READER_READING_MODE,
  READER_TAP_ZONE_WIDTH,
  type ReaderPageFit,
  type ReaderReadingMode,
  type ReaderSettings,
} from '@tanuki/contracts';
import useUpdateReaderSettings from '@/entities/reader/hooks/useUpdateReaderSettings';
import ReaderTapZonePreview from '@/entities/reader/ReaderTapZonePreview';
import GroupedList from '@/shared/ui/GroupedList';
import { getReaderPresets, getReaderSelectOptions } from './lib';
import {
  getReadingModeChoices,
  getPageFitChoices,
  getDirectionChoices,
  getPageLayoutChoices,
} from '@/entities/reader/settings';
import ReaderSliderRow from './ReaderSliderRow';
import styles from './SettingsReader.module.scss';

type Props = {
  settings: ReaderSettings;
};

/** Настройки читалки: режим, вписывание, отступы и зоны касания. */
function SettingsReaderForm({ settings }: Props) {
  const { t } = useTranslation();
  const updateSettings = useUpdateReaderSettings();

  const update = (patch: Partial<ReaderSettings>) =>
    updateSettings.mutate({ ...settings, ...patch });

  const isHorizontal = settings.readingMode === READER_READING_MODE.HORIZONTAL;
  const isFitWidth = settings.pageFit === READER_PAGE_FIT.FIT_WIDTH;

  const readingModeOptions = getReaderSelectOptions(getReadingModeChoices(t));
  const readingMode = readingModeOptions.find(({ value }) => value === settings.readingMode);
  const pageFitOptions = getReaderSelectOptions(getPageFitChoices(t));
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
              aria-label={t('readingMode')}
              data={readingModeOptions}
              value={settings.readingMode}
              onChange={(value) => value && update({ readingMode: value as ReaderReadingMode })}
              leftSection={<BookOpenIcon />}
              allowDeselect={false}
            />
          }
        />
        <GroupedList.Row
          icon={<ImageIcon />}
          title={t('pageScale')}
          description={pageFit?.description}
          action={
            <Select
              aria-label={t('pageScale')}
              data={pageFitOptions}
              value={settings.pageFit}
              onChange={(value) => value && update({ pageFit: value as ReaderPageFit })}
              leftSection={<ImageIcon />}
              allowDeselect={false}
            />
          }
        />
        {isFitWidth && (
          <ReaderSliderRow
            icon={<ArrowsOutLineHorizontalIcon />}
            title={t('containerWidth')}
            description={isFitWidth ? t('pageStripWidthOnWideScreen') : t('onlyWithByWidthScale')}
            unit="px"
            value={settings.containerWidth}
            range={READER_CONTAINER_WIDTH}
            presets={getReaderPresets(READER_CONTAINER_WIDTH, t)}
            onChange={(containerWidth) => update({ containerWidth })}
            disabled={false}
          />
        )}
        <ReaderSliderRow
          icon={<SunIcon />}
          title={t('brightness')}
          description={t('darkeningPagesInReader')}
          unit="%"
          value={settings.brightness}
          range={READER_BRIGHTNESS}
          presets={[READER_BRIGHTNESS.MIN, READER_BRIGHTNESS.MEDIUM, READER_BRIGHTNESS.MAX].map(
            (value) => ({ label: `${value}%`, value }),
          )}
          onChange={(brightness) => update({ brightness })}
          disabled={false}
        />
      </GroupedList>

      {isHorizontal && (
        <Box className={styles.mainColumn}>
          <GroupedList label={t('pageByPageMode')}>
            <GroupedList.Row
              icon={<ArrowsLeftRightIcon />}
              title={t('readingDirection')}
              description={t('pageOrderAndTurningDirection')}
              action={
                <Select
                  aria-label={t('readingDirection')}
                  leftSection={<ArrowsLeftRightIcon />}
                  data={getReaderSelectOptions(getDirectionChoices(t))}
                  value={settings.direction}
                  allowDeselect={false}
                  onChange={(value) => value && update({ direction: value as ReaderDirection })}
                />
              }
            />
            <GroupedList.Row
              icon={<BookOpenIcon />}
              title={t('pages')}
              description={t('onePageOrPairOnScreen')}
              action={
                <Select
                  aria-label={t('pages')}
                  leftSection={<BookOpenIcon />}
                  data={getReaderSelectOptions(getPageLayoutChoices(t))}
                  value={settings.pageLayout}
                  allowDeselect={false}
                  onChange={(value) => value && update({ pageLayout: value as ReaderPageLayout })}
                />
              }
            />
          </GroupedList>
        </Box>
      )}
      <Box className={styles.mainColumn}>
        <GroupedList label={t('gapsAndClickZone')}>
          {isHorizontal && (
            <ReaderSliderRow
              icon={<HandTapIcon />}
              title={t('clickZone')}
              description={t('screenEdgesClickTurnsPage')}
              unit="%"
              value={settings.tapZoneWidth}
              range={READER_TAP_ZONE_WIDTH}
              presets={getReaderPresets(READER_TAP_ZONE_WIDTH, t)}
              preview={<ReaderTapZonePreview tapZoneWidth={settings.tapZoneWidth} />}
              onChange={(tapZoneWidth) => update({ tapZoneWidth })}
              disabled={false}
            />
          )}
          {!isHorizontal && (
            <ReaderSliderRow
              icon={<RowsIcon />}
              title={t('gapBetweenPages')}
              description={t('spaceBetweenPagesInStrip')}
              unit="px"
              value={settings.pageGap}
              range={READER_PAGE_GAP}
              presets={getReaderPresets(READER_PAGE_GAP, t)}
              onChange={(pageGap) => update({ pageGap })}
              disabled={false}
            />
          )}
          {!isHorizontal && (
            <ReaderSliderRow
              icon={<SplitVerticalIcon />}
              title={t('gapBetweenChapters')}
              description={t('breakInStripWhereChapterEnds')}
              unit="px"
              value={settings.chapterGap}
              range={READER_CHAPTER_GAP}
              presets={getReaderPresets(READER_CHAPTER_GAP, t)}
              onChange={(chapterGap) => update({ chapterGap })}
              disabled={false}
            />
          )}
        </GroupedList>
      </Box>

      <Box className={styles.behavior}>
        <GroupedList label={t('behavior')}>
          <GroupedList.Row
            icon={<SkipForwardIcon />}
            title={t('openNextChapterImmediately')}
            description={t('readingContinuesAfterLastPage')}
            action={
              <Switch
                aria-label={t('openNextChapterImmediately')}
                checked={settings.autoNextChapter}
                onChange={(event) => update({ autoNextChapter: event.currentTarget.checked })}
              />
            }
          />
          <GroupedList.Row
            icon={<EyeClosedIcon />}
            title={t('hidePanelsOnScroll')}
            description={t('headerAndChapterBarSlideAwayWhileReading')}
            action={
              <Switch
                aria-label={t('hidePanelsOnScroll')}
                checked={settings.hidePanelsOnScroll}
                onChange={(event) => update({ hidePanelsOnScroll: event.currentTarget.checked })}
              />
            }
          />
          <ReaderSliderRow
            icon={<ImageIcon />}
            title={t('pagePrefetch')}
            description={t('numberOfNextPagesLoadedInAdvance')}
            unit=""
            value={settings.prefetchPages}
            range={READER_PREFETCH}
            presets={[READER_PREFETCH.MIN, READER_PREFETCH.DEFAULT, READER_PREFETCH.MAX].map(
              (value) => ({ label: String(value), value }),
            )}
            onChange={(prefetchPages) => update({ prefetchPages })}
            disabled={false}
          />
          <GroupedList.Row
            icon={<EyeIcon />}
            title={t('keepScreenOn')}
            description={t('screenStaysOnWhileReadingIfSupported')}
            action={
              <Switch
                aria-label={t('keepScreenOn')}
                checked={settings.keepScreenOn}
                onChange={(event) => update({ keepScreenOn: event.currentTarget.checked })}
              />
            }
          />
        </GroupedList>
      </Box>
    </Box>
  );
}

export default SettingsReaderForm;
