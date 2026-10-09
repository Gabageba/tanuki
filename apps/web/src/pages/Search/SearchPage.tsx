import { useSearchParams } from 'react-router';
import PageLayout from '@/shared/ui/PageLayout';
import SearchInvite from './components/SearchInvite';
import SearchResults from './components/SearchResults';

/** Поиск по всем источникам; строка ввода — одна, в шапке приложения. */
function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query')?.trim() ?? '';

  return (
    <PageLayout>
      {query ? (
        <SearchResults key={query} query={query} />
      ) : (
        <PageLayout.Content>
          <SearchInvite />
        </PageLayout.Content>
      )}
    </PageLayout>
  );
}

export default SearchPage;
