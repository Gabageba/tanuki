import { Badge, Group, Stack, Title as Heading } from '@mantine/core';
import TitleBreadcrumbs from '../TitleBreadcrumbs';
import type { Title } from '@tanuki/contracts';
import { SOURCE_LOCALE } from '@tanuki/contracts';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import TitleContentRating from '../TitleContentRating';
import useSource from '@/entities/source/hooks/useSource';
import { getFlagByLocale } from '@/entities/source/lib';

type Props = {
  title: Title;
};

function TitleName({ title }: Props) {
  const { data: source } = useSource({ sourceId: title.sourceId });

  return (
    <Stack gap="sm">
      <TitleBreadcrumbs title={title} />
      <Stack gap={8}>
        <Group justify="space-between" gap={8} wrap="nowrap" align="flex-start">
          <Heading lh={1} size={30} style={{ flex: 1, minWidth: 0 }}>
            {title.name}
          </Heading>
          <Group gap={8} wrap="nowrap">
            {source && source.locale !== SOURCE_LOCALE.RU ? (
              <Badge color="gray" variant="light" ff="monospace">
                {getFlagByLocale(source.locale)} {source.locale.toUpperCase()}
              </Badge>
            ) : null}
            <TitleContentRating contentRating={title.contentRating} />
          </Group>
        </Group>

        <MidDotGroup
          gap={8}
          maxRows={1}
          separatorProps={{ c: 'dimmed', lh: 1 }}
          text={{
            lh: 1,
            c: 'dimmed',
          }}
          items={[...title.originalNames, ...title.altNames]}
        />
      </Stack>
    </Stack>
  );
}

export default TitleName;
