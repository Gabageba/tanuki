import { Flex, Group } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import CatalogHeaderSkeleton from './CatalogHeaderSkeleton';
import SourceTitle from '@/entities/source/components/SourceTitle';
import SearchInput from '@/shared/ui/SearchInput';
import PageLayout from '@/shared/ui/PageLayout';
import type { CatalogParams } from '../../models';
import { isTitleSearchLocked } from '@/entities/source/lib';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import GoBackButton from '@/shared/ui/GoBackButton';
import QueryBlock from '@/shared/ui/QueryBlock';
import type useSource from '@/entities/source/hooks/useSource';

type Props = {
  sourceQuery: ReturnType<typeof useSource>;
};

function CatalogHeader({ sourceQuery }: Props) {
  const { t } = useTranslation();
  const { params, setParams } = PageLayout.useParams<CatalogParams>();
  const [, setSearchParams] = useSearchParams();

  // Запрос живёт и в адресе: на него ведёт «Все результаты» с /search.
  const handleSearch = (query: string) => {
    setParams({ ...params, query });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (query) next.set('query', query);
        else next.delete('query');
        return next;
      },
      { replace: true },
    );
  };

  return (
    <QueryBlock
      query={sourceQuery}
      skeleton={<CatalogHeaderSkeleton />}
      offline={<CatalogHeaderSkeleton />}
    >
      {(source) => (
        <PageLayout.Header>
          <Flex justify="space-between" direction={{ base: 'column', sm: 'row' }} gap="sm">
            <Group gap="xs" wrap="nowrap" miw={0}>
              <GoBackButton path={ROUTE_PATHS.SOURCES} />
              <SourceTitle source={source} showStatus />
            </Group>
            <SearchInput
              w={{ base: '100%', sm: 300 }}
              allowClear
              handleSearch={handleSearch}
              defaultValue={params.query}
              disabled={isTitleSearchLocked(source.id, source)}
              placeholder={
                isTitleSearchLocked(source.id, source)
                  ? t('searchAvailableAfterLogin')
                  : t('searchIn', { title: source.title })
              }
              debounceMs={400}
            />
          </Flex>
        </PageLayout.Header>
      )}
    </QueryBlock>
  );
}

export default CatalogHeader;
