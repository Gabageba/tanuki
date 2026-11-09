import { Group } from '@mantine/core';
import type { Title } from '@tanuki/contracts';
import { getTitleCardPath } from '@/entities/title/card/TitleCard/lib';
import TitleScoreMeta from '@/entities/title/TitleScoreMeta';
import TitleCardTags from './TitleCardTags/TitleCardTags';

type Props = { title: Title };

function SourceTitleFooter({ title }: Props) {
  if (title.tags.length === 0 && title.rating == null && title.likes == null) return null;
  return (
    <Group gap={8} wrap="nowrap">
      <TitleCardTags to={getTitleCardPath(title.id)} tags={title.tags} />
      <TitleScoreMeta title={title} />
    </Group>
  );
}

export default SourceTitleFooter;
