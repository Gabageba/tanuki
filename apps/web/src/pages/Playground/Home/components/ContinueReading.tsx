import { useContext, useState } from 'react';
import { Group, Scroller, SimpleGrid, Stack, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { CONTINUE_CARD, type ContinueCard, type ContinueItem } from '../models';
import ContinueCardView from './ContinueCardView';
import ContinueMetaFirstCard from './ContinueMetaFirstCard';
import RemovedFromContinueMessage from './RemovedFromContinueMessage';

/** Сколько держится тост с «Отменить» — как у закладок. */
const RESTORE_TOAST_MS = 6000;

type Props = {
  items: ContinueItem[];
  card?: ContinueCard;
  /** P2 — на вкладке «Моё» лента одна, поэтому сеткой C1a: 2 колонки на телефоне, 6 на десктопе. */
  isGrid?: boolean;
  /** Заголовок над лентой; на вкладке «Моё» он не нужен. */
  withTitle?: boolean;
};

/** «Продолжить чтение»: лента последних прочитанных. «Убрать» живое — карточка пропадает сразу,
 *  тост возвращает её. Ничего не осталось — блока нет. */
function ContinueReading({
  items,
  card = CONTINUE_CARD.NARROW,
  isGrid = false,
  withTitle = true,
}: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const visibleItems = items.filter((item) => !hiddenIds.includes(item.title.id));

  if (visibleItems.length === 0) {
    return null;
  }

  const handleRemove = (titleId: string) => {
    setHiddenIds((prev) => [...prev, titleId]);
    const toastId = `continue-removed-${titleId}`;
    notifications.show({
      id: toastId,
      autoClose: RESTORE_TOAST_MS,
      message: (
        <RemovedFromContinueMessage
          onRestore={() => {
            notifications.hide(toastId);
            setHiddenIds((prev) => prev.filter((id) => id !== titleId));
          }}
        />
      ),
    });
  };

  return (
    <Stack gap="sm">
      {withTitle && <Title order={4}>Продолжить чтение</Title>}
      {isGrid ? (
        <SimpleGrid cols={isPhone ? 2 : 6} spacing="md" verticalSpacing="lg">
          {visibleItems.map((item) => (
            <ContinueMetaFirstCard
              key={item.title.id}
              item={item}
              onRemove={() => handleRemove(item.title.id)}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Scroller>
          <Group gap="md" wrap="nowrap" align="flex-start">
            {visibleItems.map((item, index) => (
              <ContinueCardView
                key={item.title.id}
                card={card}
                item={item}
                isFirst={index === 0}
                onRemove={() => handleRemove(item.title.id)}
              />
            ))}
          </Group>
        </Scroller>
      )}
    </Stack>
  );
}

export default ContinueReading;
