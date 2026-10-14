import type { ReactNode } from 'react';
import { Button, EmptyState } from '@mantine/core';
import { Link } from 'react-router';
import { GearIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { ROUTE_PATHS, SETTINGS_TAB_SEARCH_PARAM } from '@/shared/lib/routes';

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  /** Подпись кнопки в настройки — «Настроить главную» или «Настроить подборки». */
  settingsLabel?: string;
  /** E2 — вторая кнопка «Все источники». */
  withAllSources?: boolean;
};

/** Пустая главная: подборки выключены, читать ещё нечего. */
function HomeEmpty({
  icon,
  title,
  description,
  settingsLabel = 'Настроить главную',
  withAllSources = false,
}: Props) {
  return (
    <EmptyState title={title} description={description} icon={icon}>
      <EmptyState.Actions>
        <Button
          component={Link}
          to={`${ROUTE_PATHS.SETTINGS}?${SETTINGS_TAB_SEARCH_PARAM}=home`}
          variant="default"
          leftSection={<GearIcon />}
        >
          {settingsLabel}
        </Button>
        {withAllSources && (
          <Button
            component={Link}
            to={ROUTE_PATHS.SOURCES}
            variant="default"
            leftSection={<SquaresFourIcon />}
          >
            Все источники
          </Button>
        )}
      </EmptyState.Actions>
    </EmptyState>
  );
}

export default HomeEmpty;
