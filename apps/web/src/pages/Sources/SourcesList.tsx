import { Divider, SimpleGrid, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { SOURCE_CONTENT_TYPE } from '@tanuki/contracts';
import { getLabelByContentType } from '@/entities/source/lib';
import PageLayout from '@/shared/ui/PageLayout';
import type { SourcesQuery } from './models';
import SourceCard from '@/entities/source/components/SourceCard';

function SourcesList() {
  const { t } = useTranslation();
  const { data } = PageLayout.useQuery<SourcesQuery>();

  return (
    <Stack gap="xl">
      {Object.values(SOURCE_CONTENT_TYPE)
        .map((contentType) => ({ contentType, sources: data?.[contentType] ?? [] }))
        .filter(({ sources }) => sources.length > 0)
        .map(({ contentType, sources }) => (
          <div key={contentType}>
            <Divider
              label={
                <Title order={4} fw={600}>
                  {getLabelByContentType(contentType, t)}
                </Title>
              }
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
