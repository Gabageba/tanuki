import { Card, Group, SimpleGrid, Title } from '@mantine/core';
import ArrowLink from '@/shared/ui/ArrowLink';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import { EXAMPLES, META_EXAMPLES } from '../mocks';
import type { CardVariant, MetaVariant } from '../models';
import NewChapterVariantCard from './NewChapterVariantCard';
import NewChapterMetaCard from './NewChapterMetaCard';

type Props = { variant: CardVariant; metaVariant?: MetaVariant; mobile?: boolean };

function NewChaptersPreview({ variant, metaVariant, mobile = false }: Props) {
  const examples = metaVariant ? META_EXAMPLES : EXAMPLES;
  return (
    <Card withBorder radius="lg" p="md" miw={0}>
      <Card.Section withBorder inheritPadding py="sm">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Title order={4} miw={0}>
            Новые главы в закладках
          </Title>
          <ArrowLink to={ROUTE_PATHS.BOOKMARKS}>Все закладки</ArrowLink>
        </Group>
      </Card.Section>
      <Card.Section inheritPadding py="md">
        <SimpleGrid type="container" cols={mobile ? 1 : { base: 1, '600px': 2 }} spacing="md">
          {examples.map((example) =>
            metaVariant ? (
              <NewChapterMetaCard
                key={example.bookmark.titleId}
                example={example}
                variant={metaVariant}
              />
            ) : (
              <NewChapterVariantCard
                key={example.bookmark.titleId}
                example={example}
                variant={variant}
              />
            ),
          )}
        </SimpleGrid>
      </Card.Section>
    </Card>
  );
}

export default NewChaptersPreview;
