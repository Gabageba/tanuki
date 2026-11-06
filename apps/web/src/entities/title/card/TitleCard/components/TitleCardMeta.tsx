import { Badge, Group } from '@mantine/core';
import type { ReactNode } from 'react';
import { CONTENT_RATING, VIEW_MODE, type ContentRating } from '@tanuki/contracts';
import useTitleCardLayout from '../hooks/useTitleCardLayout';

type Props = { contentRating: ContentRating; children: ReactNode };

function TitleCardMeta({ contentRating, children }: Props) {
  const { viewMode } = useTitleCardLayout();
  const meta = children === 0 ? null : children;
  if (viewMode !== VIEW_MODE.LIST || contentRating !== CONTENT_RATING.ADULT) return meta;

  return (
    <Group gap={8} wrap="nowrap" miw={0}>
      <Badge variant="muted" color="red" ff="monospace" flex="none">
        18+
      </Badge>
      {meta}
    </Group>
  );
}

export default TitleCardMeta;
