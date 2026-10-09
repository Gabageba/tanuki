import { useState, type ReactNode } from 'react';
import { Button, Grid, Stack, Text, type StackProps } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { CaretDownIcon, CaretUpIcon, FunnelIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { FilterGroup, FilterSelection } from '@tanuki/contracts';
import FilterCard from './FilterCard';
import FilterDrawer from './FilterDrawer';
import FilterPills from './FilterPills';

type Props = Omit<StackProps, 'children' | 'onChange'> & {
  groups: FilterGroup[] | undefined;
  selection: FilterSelection[];
  onChange: (selection: FilterSelection[]) => void;
  /** Controls at the right edge of the row (sort, view mode). */
  actions: ReactNode;
  /** On a phone the actions stay beside the button instead of wrapping under the pills. */
  inlineActions?: boolean;
  /** Filters can't be used right now: the button is disabled, pills and panel are hidden. */
  locked?: boolean;
  lockedNote?: string;
};

/**
 * Filter row above a list: the «Фильтры» button opens the groups card (a drawer on a phone),
 * the chosen values sit below as pills, `actions` hug the right edge.
 */
function FilterBar({
  groups,
  selection,
  onChange,
  actions,
  inlineActions,
  locked,
  lockedNote,
  ...stackProps
}: Props) {
  const { t } = useTranslation();
  const [isOpened, setIsOpened] = useState(false);
  // Drawer скрыт на десктопе только через hiddenFrom (CSS), но Mantine всё равно блокирует
  // скролл страницы (RemoveScroll), пока opened=true — из-за этого не крутится колесом
  // ScrollArea в десктопной FilterCard. Открываем Drawer только на мобильном вьюпорте.
  const isMobile = useMediaQuery('(max-width: 47.9375em)', false);

  const hasGroups = !!groups?.length;
  const isPanelOpened = isOpened && !locked && hasGroups;

  return (
    <Stack gap="xs" {...stackProps}>
      <Grid gap="sm">
        <Grid.Col span={{ base: inlineActions ? 'auto' : 12, xs: 'auto' }} order={1}>
          {hasGroups && (
            <Button
              w={{ base: '100%', xs: 'auto' }}
              disabled={locked}
              leftSection={<FunnelIcon />}
              rightSection={isOpened ? <CaretUpIcon /> : <CaretDownIcon />}
              onClick={() => setIsOpened((prev) => !prev)}
              style={{ alignSelf: 'flex-start' }}
            >
              <Text>{t('filters')}</Text>
            </Button>
          )}
        </Grid.Col>
        <Grid.Col
          span={{ base: inlineActions ? 'content' : 12, xs: 'content' }}
          order={{ base: inlineActions ? 2 : 3, xs: 2 }}
        >
          {actions}
        </Grid.Col>
        {locked && hasGroups && !!lockedNote && (
          <Grid.Col span={12} order={{ base: inlineActions ? 3 : 2, xs: 3 }}>
            <Text c="dimmed" fz="xs">
              {lockedNote}
            </Text>
          </Grid.Col>
        )}
        {!locked && !!selection.length && (
          <Grid.Col span={12} order={{ base: inlineActions ? 3 : 2, xs: 3 }}>
            <FilterPills groups={groups} selection={selection} onChange={onChange} />
          </Grid.Col>
        )}
      </Grid>
      {isPanelOpened && (
        <FilterCard
          groups={groups}
          selection={selection}
          onClose={() => setIsOpened(false)}
          onChange={onChange}
        />
      )}
      <FilterDrawer
        groups={groups ?? []}
        selection={selection}
        opened={isPanelOpened && isMobile}
        onClose={() => setIsOpened(false)}
        onChange={onChange}
      />
    </Stack>
  );
}

export default FilterBar;
