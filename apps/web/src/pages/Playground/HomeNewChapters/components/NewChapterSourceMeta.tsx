import { Group } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { getCatalogSourceTitle } from '@/entities/source/lib';
import TitleMetaItems from '@/entities/title/TitleMetaItems';
import type { ChapterExample } from '../models';

type Props = Pick<ChapterExample, 'bookmark' | 'typeLabel'> & { showIcon?: boolean };

function NewChapterSourceMeta({ bookmark, typeLabel, showIcon = true }: Props) {
  const sourceTitle = getCatalogSourceTitle(bookmark.sourceId);

  return (
    <Group gap={6} wrap="nowrap" miw={0}>
      {showIcon && <SourceIcon id={bookmark.sourceId} title={sourceTitle} size={14} radius="sm" />}
      <TitleMetaItems gap={4} items={[sourceTitle, typeLabel]} />
    </Group>
  );
}

export default NewChapterSourceMeta;
