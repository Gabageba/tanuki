import type { ReactNode } from 'react';
import { Switch } from '@mantine/core';
import {
  ArrowsHorizontalIcon,
  ArrowsOutLineHorizontalIcon,
  ArrowsOutLineVerticalIcon,
  ArrowsVerticalIcon,
  BookOpenIcon,
  EyeClosedIcon,
  HandTapIcon,
  MagnifyingGlassPlusIcon,
  ProhibitIcon,
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
} from '@tanuki/contracts';
import GroupedList from '@/shared/ui/GroupedList';
import { getReaderGroupLabel } from '../lib';
import {
  CHOICE_CONTROL,
  DISABLED_HINT,
  READER_GROUP,
  type DemoRenderProps,
  type ReaderConfig,
  type ReaderGroup,
} from '../models';
import ChoiceSetting from './ChoiceSetting';
import NumberSetting from './NumberSetting';
import SettingRow from './SettingRow';
import TapZonePreview from './TapZonePreview';

type Props = DemoRenderProps & {
  config: ReaderConfig;
  /** Всё одним блоком «Читалка» (L1). При подгруппах по режиму (D2) не действует. */
  isSingleBlock?: boolean;
  /** Показать только эти блоки — чтобы вариант оси не тянул за собой всю вкладку. */
  only?: ReaderGroup[];
};

const ONLY_HORIZONTAL = 'Только в горизонтальном режиме';
const ONLY_VERTICAL = 'Только в вертикальном режиме';
const ONLY_FIT_WIDTH = 'Только при масштабе «По ширине»';

/** Настройки читалки блоками GroupedList — так, как они встанут на вкладку. */
function ReaderGroups({ settings, onChange, narrow, config, isSingleBlock = false, only }: Props) {
  const isHorizontal = settings.readingMode === READER_READING_MODE.HORIZONTAL;
  const isFitHeight = settings.pageFit === READER_PAGE_FIT.FIT_HEIGHT;
  const isSubgroups = config.hint === DISABLED_HINT.SUBGROUPS;
  // «Как в drawer» — и подписи как в drawer; в строке настроек места меньше, там они короче.
  const isDrawerLike = config.choice === CHOICE_CONTROL.CARDS;

  // Пояснение у погашенной строки: в описании (D1), в подсказке (D3). В подгруппах (D2) его даёт
  // шапка блока — кроме ширины контейнера: она зависит от масштаба, а не от режима.
  const getReason = (reason: string, isModeDependent: boolean) => {
    const hint = isSubgroups && !isModeDependent ? DISABLED_HINT.DESCRIPTION : config.hint;
    return {
      disabledDescription: hint === DISABLED_HINT.DESCRIPTION ? reason : undefined,
      disabledTooltip: hint === DISABLED_HINT.TOOLTIP ? reason : undefined,
    };
  };

  const modeRow = (
    <ChoiceSetting
      key="mode"
      control={config.choice}
      icon={<BookOpenIcon />}
      title="Режим чтения"
      value={settings.readingMode}
      onChange={(value) => onChange({ readingMode: value as ReaderReadingMode })}
      narrow={narrow}
      options={[
        {
          value: READER_READING_MODE.VERTICAL,
          title: 'Вертикальный',
          description: isDrawerLike
            ? 'Страницы идут одна под другой, скролл непрерывный'
            : 'Страницы идут лентой, листаются прокруткой',
          icon: <ArrowsVerticalIcon />,
        },
        {
          value: READER_READING_MODE.HORIZONTAL,
          title: 'Горизонтальный',
          description: isDrawerLike
            ? 'Постранично: клик или стрелки ← → переключают страницу.'
            : 'По одной странице, листаются кликом или стрелками ← →',
          icon: <ArrowsHorizontalIcon />,
        },
      ]}
    />
  );

  const fitRow = (
    <ChoiceSetting
      key="fit"
      control={config.choice}
      icon={<MagnifyingGlassPlusIcon />}
      title="Масштаб страницы"
      value={settings.pageFit}
      onChange={(value) => onChange({ pageFit: value as ReaderPageFit })}
      narrow={narrow}
      options={[
        {
          value: READER_PAGE_FIT.FIT_WIDTH,
          title: isDrawerLike ? 'Вписать по ширине' : 'По ширине',
          description: isDrawerLike
            ? 'Страница занимает всю ширину контейнера, высота — какая получится'
            : 'Страница во всю ширину контейнера, высота — какая получится',
          icon: <ArrowsOutLineHorizontalIcon />,
        },
        {
          value: READER_PAGE_FIT.FIT_HEIGHT,
          title: isDrawerLike ? 'Страница целиком' : 'Целиком',
          description: 'Высота подгоняется под экран — страница видна полностью',
          icon: <ArrowsOutLineVerticalIcon />,
        },
      ]}
    />
  );

  const containerWidthRow = (
    <NumberSetting
      key="containerWidth"
      control={config.number}
      icon={<ArrowsOutLineHorizontalIcon />}
      title="Ширина контейнера"
      description="Ширина ленты страниц на широком экране"
      unit="px"
      value={settings.containerWidth}
      min={READER_CONTAINER_WIDTH.MIN}
      max={READER_CONTAINER_WIDTH.MAX}
      presets={[
        { label: 'Узко', value: READER_CONTAINER_WIDTH.NARROW },
        { label: 'Средне', value: READER_CONTAINER_WIDTH.MEDIUM },
        { label: 'Широко', value: READER_CONTAINER_WIDTH.WIDE },
      ]}
      onChange={(containerWidth) => onChange({ containerWidth })}
      disabled={isFitHeight}
      {...getReason(ONLY_FIT_WIDTH, false)}
      narrow={narrow}
    />
  );

  const tapZoneRow = (
    <NumberSetting
      key="tapZone"
      control={config.number}
      icon={<HandTapIcon />}
      title="Область клика"
      description="Края экрана, клик по которым листает страницу"
      unit="%"
      value={settings.tapZoneWidth}
      min={READER_TAP_ZONE_WIDTH.MIN}
      max={READER_TAP_ZONE_WIDTH.MAX}
      presets={[
        { label: 'Узко', value: READER_TAP_ZONE_WIDTH.NARROW },
        { label: 'Средне', value: READER_TAP_ZONE_WIDTH.MEDIUM },
        { label: 'Широко', value: READER_TAP_ZONE_WIDTH.WIDE },
      ]}
      preview={<TapZonePreview tapZoneWidth={settings.tapZoneWidth} />}
      onChange={(tapZoneWidth) => onChange({ tapZoneWidth })}
      disabled={!isHorizontal}
      {...getReason(ONLY_HORIZONTAL, true)}
      narrow={narrow}
    />
  );

  const pageGapRow = (
    <NumberSetting
      key="pageGap"
      control={config.number}
      icon={<RowsIcon />}
      title="Отступ между страницами"
      description="Промежуток между страницами в ленте"
      unit="px"
      value={settings.pageGap}
      min={READER_PAGE_GAP.MIN}
      max={READER_PAGE_GAP.MAX}
      presets={[
        { label: 'Узко', value: READER_PAGE_GAP.NARROW },
        { label: 'Средне', value: READER_PAGE_GAP.MEDIUM },
        { label: 'Широко', value: READER_PAGE_GAP.WIDE },
      ]}
      onChange={(pageGap) => onChange({ pageGap })}
      disabled={isHorizontal}
      {...getReason(ONLY_VERTICAL, true)}
      narrow={narrow}
    />
  );

  const chapterGapRow = (
    <NumberSetting
      key="chapterGap"
      control={config.number}
      icon={<SplitVerticalIcon />}
      title="Отступ между главами"
      description="Разрыв в ленте там, где кончается глава"
      unit="px"
      value={settings.chapterGap}
      min={READER_CHAPTER_GAP.MIN}
      max={READER_CHAPTER_GAP.MAX}
      presets={[
        { label: 'Узко', value: READER_CHAPTER_GAP.NARROW },
        { label: 'Средне', value: READER_CHAPTER_GAP.MEDIUM },
        { label: 'Широко', value: READER_CHAPTER_GAP.WIDE },
      ]}
      onChange={(chapterGap) => onChange({ chapterGap })}
      disabled={isHorizontal}
      {...getReason(ONLY_VERTICAL, true)}
      narrow={narrow}
    />
  );

  const autoNextRow = (
    <SettingRow
      key="autoNext"
      icon={<SkipForwardIcon />}
      title="Сразу открывать следующую главу"
      description={
        settings.autoNextChapter
          ? 'Дочитанная глава сразу продолжается следующей'
          : 'В конце главы — экран с переходом к следующей'
      }
      action={
        <Switch
          checked={settings.autoNextChapter}
          onChange={(event) => onChange({ autoNextChapter: event.currentTarget.checked })}
        />
      }
      narrow={narrow}
    />
  );

  const hidePanelsRow = (
    <SettingRow
      key="hidePanels"
      icon={<EyeClosedIcon />}
      title="Скрывать панели при прокрутке"
      description={
        settings.hidePanelsOnScroll
          ? 'Шапка и панель глав уезжают, пока вы читаете'
          : 'Панели прячет и возвращает только тап по странице'
      }
      action={
        <Switch
          checked={settings.hidePanelsOnScroll}
          onChange={(event) => onChange({ hidePanelsOnScroll: event.currentTarget.checked })}
        />
      }
      narrow={narrow}
    />
  );

  const inactiveHeader = (description: string) => (
    <GroupedList.Header
      icon={<ProhibitIcon />}
      title="Сейчас не действует"
      description={description}
    />
  );

  const getGroups = (): { group: ReaderGroup; header?: ReactNode; rows: ReactNode[] }[] => {
    if (isSubgroups) {
      return [
        { group: READER_GROUP.DISPLAY, rows: [modeRow, fitRow, containerWidthRow] },
        {
          group: READER_GROUP.VERTICAL,
          header: isHorizontal && inactiveHeader('Включён горизонтальный режим'),
          rows: [pageGapRow, chapterGapRow],
        },
        {
          group: READER_GROUP.HORIZONTAL,
          header: !isHorizontal && inactiveHeader('Включён вертикальный режим'),
          rows: [tapZoneRow],
        },
        { group: READER_GROUP.BEHAVIOR, rows: [autoNextRow, hidePanelsRow] },
      ];
    }
    if (isSingleBlock) {
      return [
        {
          group: READER_GROUP.READER,
          rows: [
            modeRow,
            fitRow,
            containerWidthRow,
            tapZoneRow,
            pageGapRow,
            chapterGapRow,
            autoNextRow,
            hidePanelsRow,
          ],
        },
      ];
    }
    return [
      { group: READER_GROUP.DISPLAY, rows: [modeRow, fitRow, containerWidthRow] },
      { group: READER_GROUP.SPACING, rows: [tapZoneRow, pageGapRow, chapterGapRow] },
      { group: READER_GROUP.BEHAVIOR, rows: [autoNextRow, hidePanelsRow] },
    ];
  };

  return getGroups()
    .filter(({ group }) => !only || only.includes(group))
    .map(({ group, header, rows }) => (
      <GroupedList key={group} label={getReaderGroupLabel(group)}>
        {header}
        {rows}
      </GroupedList>
    ));
}

export default ReaderGroups;
