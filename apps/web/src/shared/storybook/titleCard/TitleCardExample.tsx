import { ArrowSquareOutIcon, FolderSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { BOOKMARK_AVAILABILITY, CONTENT_RATING } from '@tanuki/contracts';
import TitleCard from '@/entities/title/card/TitleCard/TitleCard';
import TitleCardSkeleton from '@/entities/title/card/TitleCard/TitleCardSkeleton';
import { TITLE } from '../titles';
import {
  EXAMPLE_ACTION_TO,
  EXAMPLE_MOVE_ACTION,
  EXAMPLE_REMOVE_ACTION,
  EXAMPLE_TITLE,
  type TitleCardExampleOptions,
} from './models';
import TitleCardExampleMeta from './TitleCardExampleMeta';
import TitleCardExampleFooter from './TitleCardExampleFooter';

type Props = TitleCardExampleOptions & { skeleton?: boolean };

/** Данные, два слота и массив действий; имя, обложка и описание общие. */
function TitleCardExample({
  skeleton = false,
  detailed = false,
  withMeta = true,
  withActions = false,
  disabledAction = false,
  emptyMeta = false,
  zero = false,
  noCover = false,
  hidden = false,
  overlay = false,
  ...layout
}: Props) {
  const { t } = useTranslation();
  const slots = {
    meta: withMeta ? (
      zero ? (
        skeleton ? null : (
          0
        )
      ) : (
        <TitleCardExampleMeta skeleton={skeleton} detailed={detailed} empty={emptyMeta} />
      )
    ) : undefined,
    footer: withMeta ? (
      <TitleCardExampleFooter skeleton={skeleton} detailed={detailed} />
    ) : undefined,
  };

  if (skeleton)
    return (
      <TitleCardSkeleton
        {...layout}
        {...slots}
        withActions={withActions}
        withDescription={detailed}
      />
    );

  return (
    <TitleCard
      {...layout}
      {...slots}
      actions={
        withActions
          ? [
              {
                id: 'moveToFolder',
                children: t('moveToFolder'),
                leftSection: <FolderSimpleIcon size={16} />,
                onClick: EXAMPLE_MOVE_ACTION,
                disabled: disabledAction,
              },
              {
                id: 'openOnSource',
                children: t('openOnSource'),
                leftSection: <ArrowSquareOutIcon size={16} />,
                to: EXAMPLE_ACTION_TO,
              },
              {
                id: 'removeFromBookmarks',
                children: t('removeFromBookmarks'),
                leftSection: <TrashIcon size={16} />,
                color: 'red',
                onClick: EXAMPLE_REMOVE_ACTION,
              },
            ]
          : []
      }
      data={{
        id: TITLE.id,
        sourceId: TITLE.sourceId,
        name: EXAMPLE_TITLE.name,
        coverUrl: noCover ? null : EXAMPLE_TITLE.coverUrl,
        contentRating: hidden ? CONTENT_RATING.ADULT : CONTENT_RATING.SAFE,
        description: detailed ? TITLE.description : null,
        availability: overlay ? BOOKMARK_AVAILABILITY.SOURCE_DOWN : BOOKMARK_AVAILABILITY.AVAILABLE,
      }}
    />
  );
}

export default TitleCardExample;
