import { ActionIcon, Flex, Group } from '@mantine/core';
import { CaretLeftIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import CatalogHeaderSkeleton from './CatalogHeaderSkeleton';
import SourceTitle from '@/entities/source/components/SourceTitle';
import SearchInput from '@/shared/ui/SearcInput';
import PageLayout from '@/shared/ui/PageLayout';
import type { CatalogParams } from '../../models';
import type { Source } from '@tanuki/contracts';
import { ROUTE_PATHS } from '@/shared/consts/routes';

type Props = {
  source: Source | undefined;
  isLoading: boolean;
};

function CatalogHeader({ source, isLoading }: Props) {
  const navigate = useNavigate();
  const { params, setParams } = PageLayout.useParams<CatalogParams>();

  const handleSearch = (query: string) => {
    setParams({ ...params, query });
  };

  if (isLoading) {
    return <CatalogHeaderSkeleton />;
  }

  if (!source) {
    return null;
  }

  return (
    <PageLayout.Header>
      <Flex justify="space-between" direction={{ base: 'column', sm: 'row' }} gap="sm">
        <Group gap="xs">
          <ActionIcon variant="subtle" color="gray" onClick={() => navigate(ROUTE_PATHS.SOURCES)}>
            <CaretLeftIcon />
          </ActionIcon>
          <SourceTitle source={source} showStatus />
        </Group>
        <SearchInput
          w={{ base: '100%', sm: 300 }}
          allowClear
          handleSearch={handleSearch}
          placeholder={`Искать в ${source.title}`}
          debounceMs={400}
        />
      </Flex>
    </PageLayout.Header>
  );
}

export default CatalogHeader;
