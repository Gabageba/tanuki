import { Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import CollapsibleGroup from '@/shared/ui/CollapsibleGroup';
import CollapsibleText from '@/shared/ui/CollapsibleText';
import TagBadge from '@/shared/ui/TagBadge';
import type { Manga } from '@tanuki/contracts';
import MangaMatches from '../MangaMatches';
import MangaInfo from '../MangaInfo';

type Props = {
  manga: Manga;
};

function MangaInfoTabContent({ manga }: Props) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Stack gap={8}>
        <Title order={5}>{t('description')}</Title>
        <CollapsibleText lineClamp={3}>{manga.description}</CollapsibleText>
      </Stack>
      <Stack gap={8}>
        <Title order={5}>{t('tags')}</Title>
        <CollapsibleGroup gap={6} maxRows={2}>
          {manga.tags.map((tag) => (
            <TagBadge key={tag.id}>{tag.title}</TagBadge>
          ))}
        </CollapsibleGroup>
      </Stack>
      <MangaMatches manga={manga} />
      <MangaInfo manga={manga} />
    </Stack>
  );
}

export default MangaInfoTabContent;
