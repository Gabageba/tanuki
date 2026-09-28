import { Flex, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import CatalogHeaderSkeleton from './CatalogHeaderSkeleton';
import SourceTitle from '@/entities/source/components/SourceTitle';
import SearchInput from '@/shared/ui/SearcInput';
import PageLayout from '@/shared/ui/PageLayout';
import type { CatalogParams } from '../../models';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import GoBackButton from '@/shared/ui/GoBackButton';

type Props = {
  source: Source | undefined;
  isPending: boolean;
};

function CatalogHeader({ source, isPending }: Props) {
  const { t } = useTranslation();
  const { params, setParams } = PageLayout.useParams<CatalogParams>();

  const handleSearch = (query: string) => {
    setParams({ ...params, query });
  };

  if (isPending) {
    return <CatalogHeaderSkeleton />;
  }

  if (!source) {
    return null;
  }

  return (
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
          placeholder={t('searchIn', { title: source.title })}
          debounceMs={400}
        />
      </Flex>
    </PageLayout.Header>
  );
}

export default CatalogHeader;
