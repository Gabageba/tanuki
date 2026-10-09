import { useContext, useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { CaretDownIcon, CaretUpIcon, FunnelIcon } from '@phosphor-icons/react';
import ViewModeSwitch from '@/shared/ui/ViewModeSwitch';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import {
  PHONE_TOOLBAR,
  TOOLBAR_LAYOUT,
  VIEW_MODE_CONTEXT,
  type PhoneToolbar,
  type SearchFilters,
  type ToolbarLayout,
} from '../models';
import CatalogLikeFilterCard from './CatalogLikeFilterCard';
import CatalogLikeFilterPills from './CatalogLikeFilterPills';
import SettingsToolbar from './SettingsToolbar';

type Props = {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  toolbarLayout?: ToolbarLayout;
  phoneToolbar?: PhoneToolbar;
};

/** F6 — строка над выдачей, копия `CatalogSettings` без сортировки: «Фильтры», вид, пилюли;
 *  кнопка раскрывает карточку фильтров. Расстановку меняют оси G (десктоп) и M (телефон); на
 *  телефоне кнопка открывает drawer — он показан отдельной рамкой. */
function CatalogLikeSettings({
  filters,
  onChange,
  toolbarLayout = TOOLBAR_LAYOUT.CATALOG,
  phoneToolbar = PHONE_TOOLBAR.SEPARATE_ROW,
}: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const { viewMode, setViewMode } = useContext(VIEW_MODE_CONTEXT);
  const [isOpened, setIsOpened] = useState(false);

  const isFiltersGrow = isPhone && phoneToolbar !== PHONE_TOOLBAR.SPACE_BETWEEN;
  const filtersButton = (
    <Button
      w={isFiltersGrow ? '100%' : 'auto'}
      leftSection={<FunnelIcon />}
      rightSection={isOpened && !isPhone ? <CaretUpIcon /> : <CaretDownIcon />}
      onClick={() => setIsOpened((prev) => !prev)}
    >
      <Text>Фильтры</Text>
    </Button>
  );
  const viewSwitch = <ViewModeSwitch value={viewMode} onChange={setViewMode} />;
  const pills = <CatalogLikeFilterPills filters={filters} onChange={onChange} />;

  return (
    <Stack gap="xs" w="100%">
      <SettingsToolbar
        filtersButton={filtersButton}
        viewSwitch={viewSwitch}
        pills={pills}
        isPhone={isPhone}
        toolbarLayout={toolbarLayout}
        phoneToolbar={phoneToolbar}
      />
      {isOpened && !isPhone && (
        <CatalogLikeFilterCard
          filters={filters}
          onClose={() => setIsOpened(false)}
          onChange={onChange}
        />
      )}
    </Stack>
  );
}

export default CatalogLikeSettings;
