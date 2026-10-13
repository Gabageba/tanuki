import { use, useRef, useState, type ReactNode } from 'react';
import { Box, Divider, Group, Stack } from '@mantine/core';
import { generatePath } from 'react-router';
import { SOURCE_STATUS } from '@tanuki/contracts';
import SourceTitle from '@/entities/source/components/SourceTitle';
import { VIEW_MODE, type ViewMode } from '@/shared/lib/viewMode';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import ArrowLink from '@/shared/ui/ArrowLink';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { MOCK_SELECTIONS } from '../mocks';
import {
  BLOCK_END,
  FEED_STATE,
  LIST_PANEL,
  PERIOD_PICKER,
  PICKER_PLACEMENT,
  READING_PERIOD,
  SINGLE_BLOCK,
  SOURCE_PICKER,
  type FeedState,
  type MockSelectionsSource,
  type ReadingPeriod,
  type SelectionsLook,
} from '../models';
import BlockFeed from './BlockFeed';
import BlockFilters from './BlockFilters';
import BlockTabs from './BlockTabs';
import CatalogButton from './CatalogButton';
import CatalogViewControls from './CatalogViewControls';
import ListPanelRow from './ListPanelRow';
import PageTitleMock from './PageTitleMock';
import PeriodSelect from './PeriodSelect';
import ScrollWindow from './ScrollWindow';
import SingleBlockLabel from './SingleBlockLabel';
import SourceMissedMock from './SourceMissedMock';
import SourcePickerControl from './SourcePickerControl';

type Props = {
  look: SelectionsLook;
  entries?: MockSelectionsSource[];
  initialSourceId?: string;
  initialBlockId?: string;
  state?: FeedState;
  /** Итог: следующая порция один раз падает — видно F1 вживую. */
  failNextPageOnce?: boolean;
};

/** Состояния, у которых главное — внизу сетки: окно открывается сразу там. */
const BOTTOM_STATES: FeedState[] = [
  FEED_STATE.LOADING_MORE,
  FEED_STATE.END,
  FEED_STATE.NEXT_PAGE_ERROR,
];

/**
 * R1 — страница подборок: источник выбирается селектором (ось S, место — ось M), блоки
 * источника — вкладками (T), открытый блок — сеткой с подгрузкой по прокрутке (E, F). Всё живое:
 * источник и блок переключаются, `live` догружает порции.
 */
function SelectionsMock({
  look,
  entries = MOCK_SELECTIONS,
  initialSourceId,
  initialBlockId,
  state = FEED_STATE.LIVE,
  failNextPageOnce = false,
}: Props) {
  const isPhone = use(PHONE_FRAME_CONTEXT);
  const [sourceId, setSourceId] = useState(initialSourceId ?? entries[0]?.source.id ?? '');
  const [blockId, setBlockId] = useState(initialBlockId);
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.GRID);
  const [period, setPeriod] = useState<ReadingPeriod>(READING_PERIOD.DAY);
  const [variantId, setVariantId] = useState<string | undefined>();
  const loadMoreRef = useRef<(() => void) | null>(null);

  const entry = entries.find(({ source }) => source.id === sourceId) ?? entries[0];
  if (!entry) return null;
  const { source, blocks } = entry;
  const block = blocks.find(({ id }) => id === blockId) ?? blocks[0];
  if (!block) return null;
  const isMissed = source.status !== SOURCE_STATUS.OK;
  const hasPeriod = look.period !== PERIOD_PICKER.NONE && Boolean(block.hasPeriod);
  const variant = block.variants?.find(({ id }) => id === variantId) ?? block.variants?.[0];
  const salt = hasPeriod ? `${period}${variant?.id ?? ''}` : '';

  const handleSourceChange = (nextId: string) => {
    setSourceId(nextId);
    setBlockId(undefined);
  };

  const sources = entries.map((item) => item.source);
  const picker = (
    <SourcePickerControl
      picker={look.picker}
      sources={sources}
      activeId={source.id}
      onChange={handleSourceChange}
      isPhone={isPhone}
      catalog={look.catalog}
    />
  );
  const catalogControls = (
    <CatalogViewControls
      source={source}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      catalog={look.catalog}
    />
  );
  const controls =
    hasPeriod && look.period === PERIOD_PICKER.SELECT ? (
      <Group gap="md" wrap="nowrap" flex="none">
        <PeriodSelect value={period} onChange={setPeriod} />
        {catalogControls}
      </Group>
    ) : (
      catalogControls
    );
  const filters =
    hasPeriod && !isMissed && look.period !== PERIOD_PICKER.SELECT ? (
      <BlockFilters
        block={block}
        period={period}
        onPeriodChange={setPeriod}
        variantId={variant?.id}
        onVariantChange={setVariantId}
      />
    ) : null;
  // S0: чипы не показывают, что выбрано, крупно — под ними остаётся `SourceTitle`, как сейчас.
  const sourceHeading =
    look.picker === SOURCE_PICKER.CHIPS ? (
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Box miw={0}>
          <SourceTitle source={source} />
        </Box>
        {!isPhone && controls}
      </Group>
    ) : null;

  let tabs: ReactNode = null;
  if (!isMissed) {
    tabs =
      blocks.length === 1 && look.singleBlock === SINGLE_BLOCK.LABEL ? (
        <SingleBlockLabel block={block} />
      ) : (
        <BlockTabs
          blocks={blocks}
          activeId={block.id}
          onChange={(nextId) => {
            setBlockId(nextId);
            setVariantId(undefined);
          }}
          look={look.tabs}
          withFiniteCount={look.end === BLOCK_END.TAB_COUNT}
        />
      );
  }

  const phoneControls = (
    <Group justify="space-between" gap="sm">
      {controls}
    </Group>
  );

  const panelCatalog =
    look.panel === LIST_PANEL.BUTTON_SM || look.panel === LIST_PANEL.BUTTON_XS ? (
      <CatalogButton
        source={source}
        size={look.panel === LIST_PANEL.BUTTON_SM ? 'sm' : 'xs'}
        withSourceName={look.panel === LIST_PANEL.BUTTON_XS}
      />
    ) : null;
  // В панели период — полем (P2) или переключателями (P1/P3), смотря по оси P.
  const isShortButtonPanel = look.panel === LIST_PANEL.HEADER_SHORT_BUTTON;
  let panelFilters: ReactNode = null;
  if (hasPeriod) {
    panelFilters =
      look.period === PERIOD_PICKER.SELECT ? (
        <PeriodSelect
          value={period}
          onChange={setPeriod}
          fullWidth={isPhone && isShortButtonPanel}
        />
      ) : (
        filters
      );
  }
  const panel = isMissed ? null : (
    <ListPanelRow
      filters={panelFilters}
      actions={
        <>
          {panelCatalog}
          <ViewModeSwitch value={viewMode} onChange={setViewMode} />
        </>
      }
      isPhone={isPhone}
      isSingleRowOnPhone={isShortButtonPanel}
    />
  );

  let header: ReactNode;
  if (look.panel !== LIST_PANEL.NONE) {
    // Ось H: в шапке только источник и вкладки; у H3 справа от источника — кнопка каталога.
    header = (
      <Stack gap="md">
        <PageTitleMock />
        <Group justify="space-between" wrap={isPhone ? 'wrap' : 'nowrap'} gap="sm">
          <Box flex={1} miw={0}>
            {picker}
          </Box>
          {look.panel === LIST_PANEL.HEADER_BUTTON && (
            <CatalogButton source={source} size="xs" withSourceName />
          )}
          {isShortButtonPanel && <CatalogButton source={source} size="sm" withSourceName={false} />}
          {look.panel === LIST_PANEL.HEADER_LINK && (
            <ArrowLink to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}>
              Каталог
            </ArrowLink>
          )}
        </Group>
        {tabs}
      </Stack>
    );
  } else if (isPhone) {
    header = (
      <Stack gap="md">
        <PageTitleMock />
        {picker}
        {sourceHeading}
        {phoneControls}
        {tabs}
      </Stack>
    );
  } else if (look.picker === SOURCE_PICKER.CHIPS) {
    header = (
      <Stack gap="md">
        <PageTitleMock />
        {picker}
        {sourceHeading}
        {tabs}
      </Stack>
    );
  } else {
    switch (look.placement) {
      case PICKER_PLACEMENT.BELOW_TITLE:
        header = (
          <Stack gap="md">
            <PageTitleMock />
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Box flex={1} miw={0}>
                {picker}
              </Box>
              {controls}
            </Group>
            {tabs}
          </Stack>
        );
        break;
      case PICKER_PLACEMENT.IN_TITLE:
        header = (
          <Stack gap="md">
            <PageTitleMock rightSection={<Box miw={0}>{picker}</Box>} />
            <Group justify="space-between" wrap="nowrap" gap="md" align="flex-end">
              <Box flex={1} miw={0}>
                {tabs}
              </Box>
              {controls}
            </Group>
          </Stack>
        );
        break;
      case PICKER_PLACEMENT.WITH_TABS:
        header = (
          <Stack gap="md">
            <PageTitleMock rightSection={controls} />
            <Group wrap="nowrap" gap="md" align="center">
              <Box flex="none" maw="40%">
                {picker}
              </Box>
              <Divider orientation="vertical" />
              <Box flex={1} miw={0}>
                {tabs}
              </Box>
            </Group>
          </Stack>
        );
        break;
    }
  }

  return (
    <ScrollWindow
      onBottomReached={() => loadMoreRef.current?.()}
      startAtBottom={BOTTOM_STATES.includes(state)}
    >
      <Stack gap="lg">
        {header}
        {look.panel === LIST_PANEL.NONE ? filters : panel}
        {isMissed ? (
          <SourceMissedMock source={source} />
        ) : (
          <BlockFeed
            key={`${source.id}:${block.id}:${salt}`}
            source={source}
            block={block}
            state={state}
            viewMode={viewMode}
            salt={salt}
            failNextPageOnce={failNextPageOnce}
            end={look.end}
            nextPageError={look.nextPageError}
            onLoadMoreChange={(loadMore) => {
              loadMoreRef.current = loadMore;
            }}
          />
        )}
      </Stack>
    </ScrollWindow>
  );
}

export default SelectionsMock;
