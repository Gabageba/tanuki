import { CloseButton, Group, Text, UnstyledButton } from '@mantine/core';
import { ClockCounterClockwiseIcon } from '@phosphor-icons/react';
import { REMOVE_VISIBILITY, type RemoveVisibility } from '../models';
import styles from '../TitleSearch.module.scss';

type Props = {
  query: string;
  withIcon?: boolean;
  removeVisibility: RemoveVisibility;
  /** Крупнее — для пустой страницы `/search`. */
  isLarge?: boolean;
  /** Плотнее — D3. */
  isCompact?: boolean;
};

/** Недавний запрос: клик повторяет поиск без фильтров, крестик удаляет без подтверждения. */
function RecentRow({
  query,
  withIcon = true,
  removeVisibility,
  isLarge = false,
  isCompact = false,
}: Props) {
  const getPaddingY = () => {
    if (isLarge) return 10;
    if (isCompact) return 4;
    return 7;
  };

  return (
    <Group className={styles.recentRow} gap="xs" wrap="nowrap" px="sm" py={getPaddingY()} bdrs="sm">
      <UnstyledButton flex={1} miw={0}>
        <Group gap="sm" wrap="nowrap">
          {withIcon && (
            <ClockCounterClockwiseIcon
              size={isLarge ? 20 : 16}
              color="var(--mantine-color-dimmed)"
              style={{ flex: 'none' }}
            />
          )}
          <Text fz={isLarge ? 'md' : 'sm'} truncate>
            {query}
          </Text>
        </Group>
      </UnstyledButton>
      <CloseButton
        size="sm"
        aria-label="Удалить из недавних"
        className={removeVisibility === REMOVE_VISIBILITY.HOVER ? styles.removeOnHover : undefined}
      />
    </Group>
  );
}

export default RecentRow;
