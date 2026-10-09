import { Divider, Paper, Stack } from '@mantine/core';
import {
  ROW_APPEARANCE,
  ROWS,
  type Counter,
  type Dismiss,
  type Leading,
  type MockNotification,
  type RowAppearance,
  type Rows,
} from '../models';
import NotificationRow from './NotificationRow';
import NotificationRowWhole from './NotificationRowWhole';

type Props = {
  items: MockNotification[];
  rows: Rows;
  leading: Leading;
  counter: Counter;
  dismiss?: Dismiss;
  onRemove: (id: string) => void;
};

/** Отступ разделителя R4: обложка 40 + зазор 12 + внутренний отступ строки 12. */
const INSET = 64;

/** Список строк в выбранном способе отделения строк друг от друга. */
function FeedRows({ items, rows, leading, counter, dismiss, onRemove }: Props) {
  const renderWhole = (item: MockNotification, appearance: RowAppearance) => (
    <NotificationRowWhole
      key={item.id}
      item={item}
      leading={leading}
      counter={counter}
      appearance={appearance}
      dismiss={dismiss}
      onOpen={() => onRemove(item.id)}
      onRemove={() => onRemove(item.id)}
    />
  );
  const withDividers = (inset: number) =>
    items.map((item, index) => (
      <Stack key={item.id} gap={0}>
        {index > 0 && <Divider ml={inset} />}
        {renderWhole(item, ROW_APPEARANCE.SQUARE)}
      </Stack>
    ));

  switch (rows) {
    case ROWS.LEGACY:
      return (
        <Stack gap={0}>
          {items.map((item, index) => (
            <Stack key={item.id} gap={0}>
              {index > 0 && <Divider />}
              <NotificationRow
                item={item}
                leading={leading}
                counter={counter}
                onOpen={() => onRemove(item.id)}
                onRemove={() => onRemove(item.id)}
              />
            </Stack>
          ))}
        </Stack>
      );
    case ROWS.FULL_DIVIDER:
      return <Stack gap={0}>{withDividers(0)}</Stack>;
    case ROWS.INSET_DIVIDER:
      return <Stack gap={0}>{withDividers(INSET)}</Stack>;
    case ROWS.FRAME:
      return (
        <Paper withBorder style={{ overflow: 'hidden' }}>
          <Stack gap={0}>{withDividers(0)}</Stack>
        </Paper>
      );
    case ROWS.CARDS:
      return <Stack gap="xs">{items.map((item) => renderWhole(item, ROW_APPEARANCE.CARD))}</Stack>;
    case ROWS.PLAIN:
      return (
        <Stack gap={2}>{items.map((item) => renderWhole(item, ROW_APPEARANCE.ROUNDED))}</Stack>
      );
  }
}

export default FeedRows;
