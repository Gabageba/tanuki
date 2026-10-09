import { useState } from 'react';
import { Stack } from '@mantine/core';
import { applyFilters, applySourceFilter, countFilters } from '../lib';
import { MOCK_FOUND, MOCK_MISSED } from '../mocks';
import {
  BASE_SUMMARY_CONFIG,
  CARD_LAYOUT,
  EMPTY_FILTERS,
  type SearchFilters,
  type SummaryConfig,
} from '../models';
import CatalogLikeSettings from './CatalogLikeSettings';
import HeaderResultsFor from './HeaderResultsFor';
import MissedCollapse from './MissedCollapse';
import NothingFound from './NothingFound';
import PageHeaderBox from './PageHeaderBox';
import ResultCards from './ResultCards';
import SectionHeaderLink from './SectionHeaderLink';
import SeparatedSections from './SeparatedSections';
import SourceAnchors from './SourceAnchors';
import SourceSection from './SourceSection';

type Props = {
  /** Что поменять относительно выбранного итога — по одной оси доработки. */
  config?: Partial<SummaryConfig>;
  /** «Не ответили» раскрыт сразу — для оси N5. */
  isMissedOpened?: boolean;
  /** С чего начинают фильтры: с выбранными видны пилюли — для осей G и M. */
  initialFilters?: SearchFilters;
};

/** Итог — /search с запросом: H6c, строка фильтров F6, секции S1 с лентой L1s и «Не ответили»
 *  N3. Фильтры живые и режут выдачу, как сервер по плану. */
function SummaryResultsPage({
  config = {},
  isMissedOpened = false,
  initialFilters = EMPTY_FILTERS,
}: Props) {
  const {
    toolbarLayout,
    phoneToolbar,
    anchorStyle,
    listPreview,
    withMissedRows,
    sectionSeparator,
  } = { ...BASE_SUMMARY_CONFIG, ...config };
  const [filters, setFilters] = useState(initialFilters);
  const found = applyFilters(MOCK_FOUND, filters);
  const missed = applySourceFilter(MOCK_MISSED, filters);

  return (
    <Stack gap="lg">
      <PageHeaderBox>
        <HeaderResultsFor filtersCount={countFilters(filters)} withToolbar={false}>
          {found.length > 0 && (
            <SourceAnchors found={found} label="Нашлось на:" anchorStyle={anchorStyle} />
          )}
        </HeaderResultsFor>
      </PageHeaderBox>
      <CatalogLikeSettings
        filters={filters}
        onChange={setFilters}
        toolbarLayout={toolbarLayout}
        phoneToolbar={phoneToolbar}
      />
      {found.length > 0 ? (
        <SeparatedSections separator={sectionSeparator}>
          {found.map(({ source, items }) => (
            <SourceSection key={source.id} header={<SectionHeaderLink source={source} />}>
              <ResultCards items={items} layout={CARD_LAYOUT.SCROLLER} listPreview={listPreview} />
            </SourceSection>
          ))}
        </SeparatedSections>
      ) : (
        <NothingFound
          withFilters={countFilters(filters) > 0}
          onReset={() => setFilters(EMPTY_FILTERS)}
        />
      )}
      {missed.length > 0 && (
        <MissedCollapse missed={missed} withRows={withMissedRows} defaultOpened={isMissedOpened} />
      )}
    </Stack>
  );
}

export default SummaryResultsPage;
