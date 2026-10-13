import { Badge, Group, Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import { CONTENT_RATING, VIEW_MODE, type ContentRating } from '@tanuki/contracts';
import NavigateToTitleCard from '../../NavigateToTitleCard';

type Props = {
  titleId: string;
  /** Взрослому тайтлу — бейдж 18+ перед мета-строкой. */
  contentRating: ContentRating;
  /** Обложка слева — `TitleCardImage` или своя, как у закладки. */
  cover: ReactNode;
  meta: ReactNode;
  name: ReactNode;
  description?: ReactNode;
  /** Нижняя строка, прижата к низу карточки — теги и оценка в каталоге. */
  footer?: ReactNode;
};

/** Карточка тайтла строкой списка: обложка слева, справа мета-строка, название, описание и
 *  нижняя строка. Что в них — решает вызывающий. */
function TitleListCard({ titleId, contentRating, cover, meta, name, description, footer }: Props) {
  return (
    <NavigateToTitleCard titleId={titleId} viewMode={VIEW_MODE.LIST}>
      <Group align="stretch" wrap="nowrap" gap={0}>
        {cover}
        <Stack p="sm" flex={1} miw={0} gap={8}>
          <Stack gap={8} flex={1}>
            <Group gap={8} wrap="nowrap">
              {contentRating === CONTENT_RATING.ADULT && (
                <Badge variant="muted" color="red" ff="monospace" flex="none">
                  18+
                </Badge>
              )}
              {meta}
            </Group>
            {name}
            {description}
          </Stack>
          {footer}
        </Stack>
      </Group>
    </NavigateToTitleCard>
  );
}

export default TitleListCard;
