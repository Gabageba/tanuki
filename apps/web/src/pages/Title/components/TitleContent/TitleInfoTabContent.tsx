import { useMemo } from 'react';
import { Stack, Title as Heading } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import CollapsibleGroup from '@/shared/ui/CollapsibleGroup';
import CollapsibleText from '@/shared/ui/CollapsibleText';
import TagBadge from '@/shared/ui/TagBadge';
import type { Title } from '@tanuki/contracts';
import TitleMatches from '../TitleMatches';
import TitleInfo from '../TitleInfo';
import { renderDescriptionHtml } from './renderDescriptionHtml';

type Props = {
  title: Title;
};

function TitleInfoTabContent({ title }: Props) {
  const { t } = useTranslation();
  const description = useMemo(
    () => (title.description ? renderDescriptionHtml(title.description) : null),
    [title.description],
  );

  return (
    <Stack gap="md">
      <Stack gap={8}>
        <Heading order={5}>{t('description')}</Heading>
        <CollapsibleText lineClamp={3}>{description}</CollapsibleText>
      </Stack>
      <Stack gap={8}>
        <Heading order={5}>{t('tags')}</Heading>
        <CollapsibleGroup gap={6} maxRows={2}>
          {title.tags.map((tag) => (
            <TagBadge key={tag.id}>{tag.title}</TagBadge>
          ))}
        </CollapsibleGroup>
      </Stack>
      <TitleMatches title={title} />
      <TitleInfo title={title} />
    </Stack>
  );
}

export default TitleInfoTabContent;
