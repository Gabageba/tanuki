import { Image, ThemeIcon } from '@mantine/core';
import { getMockCoverUrl, getToneColor, getTypeIcon, getTypeTone } from '../lib';
import { LEADING, MOCK_TYPE, type Leading, type MockNotification } from '../models';

type Props = {
  item: MockNotification;
  leading: Leading;
};

/** Слева в строке: обложка тайтла у новых глав, иконка по тону — у остальных (или всегда иконка). */
function NotificationLeading({ item, leading }: Props) {
  const isCover =
    leading === LEADING.COVER_AND_ICON &&
    item.type === MOCK_TYPE.NEW_CHAPTERS &&
    item.coverSeed !== null;

  if (isCover) {
    return (
      <Image
        src={getMockCoverUrl(item.coverSeed ?? '')}
        alt={item.subject ?? ''}
        w={40}
        h={54}
        radius="sm"
        fit="cover"
        flex="none"
      />
    );
  }

  return (
    <ThemeIcon
      variant="muted"
      color={getToneColor(getTypeTone(item.type))}
      size={40}
      radius="md"
      flex="none"
    >
      {getTypeIcon(item.type)}
    </ThemeIcon>
  );
}

export default NotificationLeading;
