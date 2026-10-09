import { useState } from 'react';
import { Button, Center, Stack } from '@mantine/core';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { VIEW_MODE, type Title } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import TitleCard from '@/entities/title/card/TitleCard';
import { LIST_PREVIEW_COUNT } from '../models';

type Props = {
  items: Title[];
  getBookmarkFolder: (titleId: string) => ResolvedBookmarkFolder | null;
};

/** Вид «список»: первые карточки, остальные уже пришедшие раскрываются здесь же, без запроса. */
function ResultsListPreview({ items, getBookmarkFolder }: Props) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const hiddenCount = items.length - LIST_PREVIEW_COUNT;

  return (
    <Stack gap="xs">
      <Stack gap="sm">
        {(isExpanded ? items : items.slice(0, LIST_PREVIEW_COUNT)).map((title) => (
          <TitleCard
            key={title.id}
            title={title}
            viewMode={VIEW_MODE.LIST}
            bookmarkFolder={getBookmarkFolder(title.id)}
          />
        ))}
      </Stack>
      {hiddenCount > 0 && (
        <Center>
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            leftSection={isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? t('collapse') : t('showCountMore', { count: hiddenCount })}
          </Button>
        </Center>
      )}
    </Stack>
  );
}

export default ResultsListPreview;
