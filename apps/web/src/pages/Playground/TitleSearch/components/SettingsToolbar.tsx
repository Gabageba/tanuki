import type { ReactNode } from 'react';
import { PHONE_TOOLBAR, TOOLBAR_LAYOUT, type PhoneToolbar, type ToolbarLayout } from '../models';
import ToolbarCatalog from './ToolbarCatalog';
import ToolbarInline from './ToolbarInline';
import ToolbarPillsBetween from './ToolbarPillsBetween';

type Props = {
  filtersButton: ReactNode;
  viewSwitch: ReactNode;
  pills: ReactNode;
  isPhone: boolean;
  toolbarLayout: ToolbarLayout;
  phoneToolbar: PhoneToolbar;
};

/** Расстановка «Фильтров», вида и пилюль: на десктопе — по оси G, на телефоне — по оси M. */
function SettingsToolbar({ isPhone, toolbarLayout, phoneToolbar, ...slots }: Props) {
  if (isPhone) {
    switch (phoneToolbar) {
      case PHONE_TOOLBAR.SEPARATE_ROW:
        return <ToolbarCatalog {...slots} isPhone />;
      case PHONE_TOOLBAR.FILTERS_GROW:
        return <ToolbarInline {...slots} isFiltersGrow isSpread />;
      case PHONE_TOOLBAR.SPACE_BETWEEN:
        return <ToolbarInline {...slots} isSpread />;
    }
  }

  switch (toolbarLayout) {
    case TOOLBAR_LAYOUT.CATALOG:
      return <ToolbarCatalog {...slots} isPhone={false} />;
    case TOOLBAR_LAYOUT.NEXT_TO_FILTERS:
      return <ToolbarInline {...slots} />;
    case TOOLBAR_LAYOUT.PILLS_BETWEEN:
      return <ToolbarPillsBetween {...slots} />;
  }
}

export default SettingsToolbar;
