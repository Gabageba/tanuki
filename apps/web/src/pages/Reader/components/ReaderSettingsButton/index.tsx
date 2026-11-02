import { ActionIcon, ScrollArea, Stack, Text } from '@mantine/core';
import {
  FadersHorizontalIcon,
  EyeClosedIcon,
  SkipForwardIcon,
  EyeIcon,
} from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_READER_SETTINGS,
  READER_BRIGHTNESS,
  READER_PREFETCH,
  type ReaderDirection,
  type ReaderPageLayout,
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
import {
  getReadingModeChoices,
  getPageFitChoices,
  getDirectionChoices,
  getPageLayoutChoices,
} from '@/entities/reader/settings';
import useReaderSettings from '@/entities/reader/hooks/useReaderSettings';
import ResponsiveDrawer from '@/shared/ui/ResponsiveDrawer';
import { DRAWER_POSITION, SHEET_HEIGHT } from '@/shared/ui/ResponsiveDrawer/models';
import useUpdateReaderSettings from '@/entities/reader/hooks/useUpdateReaderSettings';
import useTapZonesHint from './hooks/useTapZonesHint';
import ReaderSetting from './ReaderSetting';
import ReaderSettingRadioGroup from './ReaderSettingRadioGroup';
import ReaderSettingSwitch from './ReaderSettingSwitch';
import ReaderSliderSetting from './ReaderSliderSetting';
import ReaderTapZonePreview from '@/entities/reader/ReaderTapZonePreview';
import ReaderTapZonesOverlay from './ReaderTapZonesOverlay';

function ReaderSettingsButton() {
  const { t } = useTranslation();
  const [isDrawerOpened, setIsDrawerOpened] = useState(false);
  const { data } = useReaderSettings();
  const updateSettings = useUpdateReaderSettings();
  const tapZonesHint = useTapZonesHint();
  const settings = data ?? DEFAULT_READER_SETTINGS;

  // Подсветку зон поверх читалки показываем не на каждое закрытие drawer'а, а только когда
  // человек трогал то, что на них влияет: иначе она мигала бы и после правки, скажем, масштаба.
  const wasTapZoneTouched = useRef(false);

  const closeDrawer = () => {
    setIsDrawerOpened(false);
    if (wasTapZoneTouched.current && settings.readingMode === READER_READING_MODE.HORIZONTAL) {
      tapZonesHint.show();
    }
  };

  // Пока ползунок тащат, читалка должна перестраиваться сразу — раньше сохранения на бек (оно
  // уходит только по onChangeEnd). Пишем черновое значение прямо в кэш запроса: он и так общий
  // источник данных для ReaderPages, поэтому лишний контекст/проброс пропсов не нужен.
  const setDraftSettings = (patch: Partial<ReaderSettings>) =>
    updateSettings.setDraft({ ...settings, ...patch });

  const readingModeItems = getReadingModeChoices(t);
  const pageFitItems = getPageFitChoices(t);

  const containerWidthPresets = [
    { id: 'narrow', label: t('narrow'), value: READER_CONTAINER_WIDTH.NARROW },
    { id: 'medium', label: t('medium'), value: READER_CONTAINER_WIDTH.MEDIUM },
    { id: 'wide', label: t('wide'), value: READER_CONTAINER_WIDTH.WIDE },
  ];

  const tapZoneWidthPresets = [
    { id: 'narrow', label: t('narrow'), value: READER_TAP_ZONE_WIDTH.NARROW },
    { id: 'medium', label: t('medium'), value: READER_TAP_ZONE_WIDTH.MEDIUM },
    { id: 'wide', label: t('wide'), value: READER_TAP_ZONE_WIDTH.WIDE },
  ];

  const pageGapPresets = [
    { id: 'narrow', label: t('narrow'), value: READER_PAGE_GAP.NARROW },
    { id: 'medium', label: t('medium'), value: READER_PAGE_GAP.MEDIUM },
    { id: 'wide', label: t('wide'), value: READER_PAGE_GAP.WIDE },
  ];

  const chapterGapPresets = [
    { id: 'narrow', label: t('narrow'), value: READER_CHAPTER_GAP.NARROW },
    { id: 'medium', label: t('medium'), value: READER_CHAPTER_GAP.MEDIUM },
    { id: 'wide', label: t('wide'), value: READER_CHAPTER_GAP.WIDE },
  ];

  return (
    <>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        aria-label={t('readerSettings')}
        onClick={() => {
          wasTapZoneTouched.current = false;
          setIsDrawerOpened(true);
        }}
      >
        <FadersHorizontalIcon />
      </ActionIcon>
      <ResponsiveDrawer
        opened={isDrawerOpened}
        onClose={closeDrawer}
        side={DRAWER_POSITION.RIGHT}
        height={SHEET_HEIGHT.TALL}
        title={t('readerSettings')}
      >
        <ScrollArea type="auto" offsetScrollbars="y" flex={1} mih={0}>
          <Stack gap="lg" data-reader-overlay>
            <ReaderSetting label={t('readingMode')}>
              <ReaderSettingRadioGroup
                value={settings.readingMode}
                items={readingModeItems}
                onChange={(value) => {
                  // Переход в горизонтальный — единственный момент, когда зоны клика вообще
                  // появляются, так что показать их после закрытия так же уместно, как и правку их
                  // ширины.
                  wasTapZoneTouched.current = true;
                  updateSettings.mutate({ ...settings, readingMode: value as ReaderReadingMode });
                }}
              />
            </ReaderSetting>

            <ReaderSetting label={t('pageScale')}>
              <ReaderSettingRadioGroup
                value={settings.pageFit}
                items={pageFitItems}
                onChange={(value) =>
                  updateSettings.mutate({ ...settings, pageFit: value as ReaderPageFit })
                }
              />
            </ReaderSetting>

            {settings.readingMode === READER_READING_MODE.HORIZONTAL && (
              <Stack gap="lg">
                <Text fw={600}>{t('pageByPageMode')}</Text>
                <ReaderSetting label={t('readingDirection')}>
                  <ReaderSettingRadioGroup
                    value={settings.direction}
                    items={getDirectionChoices(t)}
                    onChange={(value) => {
                      wasTapZoneTouched.current = true;
                      updateSettings.mutate({ ...settings, direction: value as ReaderDirection });
                    }}
                  />
                </ReaderSetting>
                <ReaderSetting label={t('pages')}>
                  <ReaderSettingRadioGroup
                    value={settings.pageLayout}
                    items={getPageLayoutChoices(t)}
                    onChange={(value) =>
                      updateSettings.mutate({ ...settings, pageLayout: value as ReaderPageLayout })
                    }
                  />
                </ReaderSetting>
              </Stack>
            )}

            {/* «Страница целиком» подгоняет страницу по высоте экрана, ширину контейнера при этом
              не смотрит — настраивать нечего. */}
            {settings.pageFit === READER_PAGE_FIT.FIT_WIDTH && (
              <ReaderSliderSetting
                label={t('containerWidth')}
                unit="px"
                value={settings.containerWidth}
                min={READER_CONTAINER_WIDTH.MIN}
                max={READER_CONTAINER_WIDTH.MAX}
                presets={containerWidthPresets}
                onChange={(containerWidth) => setDraftSettings({ containerWidth })}
                onChangeEnd={(containerWidth) =>
                  updateSettings.mutate({ ...settings, containerWidth })
                }
              />
            )}

            {settings.readingMode === READER_READING_MODE.HORIZONTAL && (
              <ReaderSliderSetting
                label={t('clickZone')}
                unit="%"
                value={settings.tapZoneWidth}
                min={READER_TAP_ZONE_WIDTH.MIN}
                max={READER_TAP_ZONE_WIDTH.MAX}
                presets={tapZoneWidthPresets}
                preview={<ReaderTapZonePreview tapZoneWidth={settings.tapZoneWidth} />}
                onChange={(tapZoneWidth) => {
                  wasTapZoneTouched.current = true;
                  setDraftSettings({ tapZoneWidth });
                }}
                onChangeEnd={(tapZoneWidth) => updateSettings.mutate({ ...settings, tapZoneWidth })}
              />
            )}

            {/* В горизонтальном режиме видна ровно одна страница — отступ между ними никогда не
              показывается, настраивать нечего. Отступ между главами там же не нужен по той же
              причине: главы сменяют друг друга страницей, а не разрывом в ленте. */}
            {settings.readingMode === READER_READING_MODE.VERTICAL && (
              <>
                <ReaderSliderSetting
                  label={t('gapBetweenPages')}
                  unit="px"
                  value={settings.pageGap}
                  min={READER_PAGE_GAP.MIN}
                  max={READER_PAGE_GAP.MAX}
                  presets={pageGapPresets}
                  onChange={(pageGap) => setDraftSettings({ pageGap })}
                  onChangeEnd={(pageGap) => updateSettings.mutate({ ...settings, pageGap })}
                />

                <ReaderSliderSetting
                  label={t('gapBetweenChapters')}
                  unit="px"
                  value={settings.chapterGap}
                  min={READER_CHAPTER_GAP.MIN}
                  max={READER_CHAPTER_GAP.MAX}
                  presets={chapterGapPresets}
                  onChange={(chapterGap) => setDraftSettings({ chapterGap })}
                  onChangeEnd={(chapterGap) => updateSettings.mutate({ ...settings, chapterGap })}
                />
              </>
            )}

            <ReaderSliderSetting
              label={t('brightness')}
              unit="%"
              value={settings.brightness}
              min={READER_BRIGHTNESS.MIN}
              max={READER_BRIGHTNESS.MAX}
              presets={[READER_BRIGHTNESS.MIN, READER_BRIGHTNESS.MEDIUM, READER_BRIGHTNESS.MAX].map(
                (value) => ({ id: String(value), label: `${value}%`, value }),
              )}
              onChange={(brightness) => setDraftSettings({ brightness })}
              onChangeEnd={(brightness) => updateSettings.mutate({ ...settings, brightness })}
            />
            <ReaderSliderSetting
              label={t('pagePrefetch')}
              unit=""
              value={settings.prefetchPages}
              min={READER_PREFETCH.MIN}
              max={READER_PREFETCH.MAX}
              presets={[READER_PREFETCH.MIN, READER_PREFETCH.DEFAULT, READER_PREFETCH.MAX].map(
                (value) => ({ id: String(value), label: String(value), value }),
              )}
              onChange={(prefetchPages) => setDraftSettings({ prefetchPages })}
              onChangeEnd={(prefetchPages) => updateSettings.mutate({ ...settings, prefetchPages })}
            />

            <ReaderSetting label={t('behavior')}>
              <ReaderSettingSwitch
                title={t('openNextChapterImmediately')}
                description={t('withoutIntermediateScreenAtEnd')}
                icon={<SkipForwardIcon />}
                checked={settings.autoNextChapter}
                onChange={(autoNextChapter) =>
                  updateSettings.mutate({ ...settings, autoNextChapter })
                }
              />
              <ReaderSettingSwitch
                title={t('hidePanelsOnScroll')}
                description={t('headerAndChapterBarSlideAwayWhileReading')}
                icon={<EyeClosedIcon />}
                checked={settings.hidePanelsOnScroll}
                onChange={(hidePanelsOnScroll) =>
                  updateSettings.mutate({ ...settings, hidePanelsOnScroll })
                }
              />
              <ReaderSettingSwitch
                title={t('keepScreenOn')}
                description={t('screenStaysOnWhileReadingIfSupported')}
                icon={<EyeIcon />}
                checked={settings.keepScreenOn}
                onChange={(keepScreenOn) => updateSettings.mutate({ ...settings, keepScreenOn })}
              />
            </ReaderSetting>
          </Stack>
        </ScrollArea>
      </ResponsiveDrawer>
      {settings.readingMode === READER_READING_MODE.HORIZONTAL && (
        <ReaderTapZonesOverlay
          tapZoneWidth={settings.tapZoneWidth}
          visible={tapZonesHint.isVisible}
        />
      )}
    </>
  );
}

export default ReaderSettingsButton;
