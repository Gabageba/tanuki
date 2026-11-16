import { useState } from 'react';
import { useForm } from '@mantine/form';
import { Flex, Group } from '@mantine/core';
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

  const urlQuery = params.query ?? '';
  const form = useForm({ initialValues: { query: urlQuery } });
  const [shownUrlQuery, setShownUrlQuery] = useState(urlQuery);
  if (urlQuery !== shownUrlQuery) {
    setShownUrlQuery(urlQuery);
    form.setFieldValue('query', urlQuery);
  }

  // Запрос живёт и в адресе: на него ведёт «Все результаты» с /search.
  const handleSearch = (query: string) => {
    setParams({ ...params, query });
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
              value={form.values.query}
              onChange={(value) => form.setFieldValue('query', value)}
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
