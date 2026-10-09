import { useState } from 'react';
import { Button, Combobox, Divider, Text, useCombobox } from '@mantine/core';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import useSearchHistory from '@/entities/search/hooks/useSearchHistory';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SearchInput from '@/shared/ui/SearchInput';
import useClearSearchHistory from '../hooks/useClearSearchHistory';
import useRemoveSearchHistoryItem from '../hooks/useRemoveSearchHistoryItem';
import RecentSearchOption from './RecentSearchOption';

type Props = {
  className?: string;
};

/**
 * Единственная строка поиска по всем источникам. На /search показывает текущий запрос, на
 * остальных страницах пуста; пустая и в фокусе — раскрывает недавние запросы. Поиск отсюда
 * всегда начинается без фильтров.
 */
function HeaderSearch({ className }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const combobox = useCombobox();
  const { data: history } = useSearchHistory();
  const removeItem = useRemoveSearchHistoryItem();
  const clearHistory = useClearSearchHistory();

  const urlQuery = pathname === ROUTE_PATHS.SEARCH ? (searchParams.get('query') ?? '') : '';
  const [query, setQuery] = useState(urlQuery);
  const [shownUrlQuery, setShownUrlQuery] = useState(urlQuery);

  // Ушли со страницы или сменили запрос — строка показывает то, что теперь в адресе.
  if (urlQuery !== shownUrlQuery) {
    setShownUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  const recent = history?.items ?? [];
  // Недавние — только у пустой строки: набранный текст ими не подсказывается.
  const isRecentShown = !query && recent.length > 0;

  const search = (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    combobox.closeDropdown();
    navigate(`${ROUTE_PATHS.SEARCH}?query=${encodeURIComponent(trimmed)}`);
  };

  return (
    <Combobox store={combobox} onOptionSubmit={search}>
      <Combobox.Target>
        <SearchInput
          className={className}
          allowClear
          placeholder={t('searchAllSources')}
          value={query}
          onChange={setQuery}
          handleSearch={search}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
        />
      </Combobox.Target>
      <Combobox.Dropdown hidden={!isRecentShown}>
        <Combobox.Header>
          <Text fz="xs" c="dimmed" lh="tight">
            {t('recentSearches')}
          </Text>
        </Combobox.Header>
        <Combobox.Options>
          {recent.map(({ query: recentQuery }) => (
            <RecentSearchOption
              key={recentQuery}
              query={recentQuery}
              onRemove={() => removeItem.mutate(recentQuery)}
            />
          ))}
        </Combobox.Options>
        <Divider my={4} />
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          fullWidth
          leftSection={<TrashIcon />}
          // Нажатие не должно уводить фокус: строка остаётся в фокусе, дропдаун сам закроется.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => clearHistory.mutate()}
        >
          {t('clearSearchHistory')}
        </Button>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default HeaderSearch;
