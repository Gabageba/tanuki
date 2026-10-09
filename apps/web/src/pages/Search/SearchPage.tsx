import { useSearchParams } from 'react-router';
import PageLayout from '@/shared/ui/PageLayout';
import SearchInvite from './components/SearchInvite';
import useSearchPageQuery from './hooks/useSearchPageQuery';
import SearchResults from './components/SearchResults';

/** Поиск по всем источникам; строка ввода — одна, в шапке приложения. */
function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query')?.trim() ?? '';

  return (
    <PageLayout useQuery={useSearchPageQuery}>
      {query ? (
        <SearchResults key={query} query={query} />
      ) : (
        // Без строки запрос отключён и вечно pending — лоадер тут не нужен.
        <PageLayout.Content showLoading={false}>
          <SearchInvite />
        </PageLayout.Content>
      )}
    </PageLayout>
  );
}

export default SearchPage;
