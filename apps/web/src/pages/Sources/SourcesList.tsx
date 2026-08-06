import { Divider, Loader, SimpleGrid, Stack, Title } from '@mantine/core';
import useSources from '@/shared/api/hooks/useSources';
import ApiErrorText from '@/shared/ui/ApiErrorText';
import { SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import SourceCard from './SourceCard';
import { getLabelByContentType } from './models';

function SourcesList() {
  const { data, error, isLoading, isError } = useSources();

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <ApiErrorText error={error} fallback="Не удалось загрузить список источников." />;
  }

  return (
    <Stack gap="xl">
      {Object.values(SOURCE_CONTENT_TYPE)
        .map((contentType) => ({ contentType, sources: data?.[contentType] ?? [] }))
        .filter(({ sources }) => sources.length > 0)
        .map(({ contentType, sources }) => (
          <div key={contentType}>
            <Divider
              label={<Title order={4}>{getLabelByContentType(contentType)}</Title>}
              labelPosition="left"
              mb="xs"
            />
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {sources.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </SimpleGrid>
          </div>
        ))}
    </Stack>
  );
}

export default SourcesList;
