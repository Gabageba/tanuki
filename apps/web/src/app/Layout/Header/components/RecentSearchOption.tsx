import { CloseButton, Combobox, Group, Text } from '@mantine/core';
import { ClockCounterClockwiseIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  query: string;
  onRemove: () => void;
};

/** Недавний запрос: клик повторяет поиск без фильтров, крестик (виден всегда) удаляет его. */
function RecentSearchOption({ query, onRemove }: Props) {
  const { t } = useTranslation();

  return (
    <Combobox.Option value={query}>
      <Group gap="sm" wrap="nowrap">
        <ClockCounterClockwiseIcon
          size={16}
          color="var(--mantine-color-dimmed)"
          style={{ flex: 'none' }}
        />
        <Text fz="sm" truncate flex={1} lh="tight">
          {query}
        </Text>
        <CloseButton
          size="sm"
          aria-label={t('removeFromRecent')}
          // Клик по крестику не должен выбрать сам пункт и увести фокус из строки.
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        />
      </Group>
    </Combobox.Option>
  );
}

export default RecentSearchOption;
