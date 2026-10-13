import type { Source } from '@tanuki/contracts';
import { SOURCE_PICKER, type CatalogLink, type SourcePicker } from '../models';
import SourceChipsPicker from './SourceChipsPicker';
import SourceDrawerPicker from './SourceDrawerPicker';
import SourceSelectPicker from './SourceSelectPicker';
import SourceTitleMenu from './SourceTitleMenu';

type Props = {
  picker: SourcePicker;
  sources: Source[];
  activeId: string;
  onChange: (sourceId: string) => void;
  isPhone: boolean;
  catalog: CatalogLink;
};

/** Выбор источника в форме оси S. */
function SourcePickerControl({ picker, sources, activeId, onChange, isPhone, catalog }: Props) {
  switch (picker) {
    case SOURCE_PICKER.CHIPS:
      return <SourceChipsPicker sources={sources} activeId={activeId} onChange={onChange} />;
    case SOURCE_PICKER.SELECT:
      return (
        <SourceSelectPicker
          sources={sources}
          activeId={activeId}
          onChange={onChange}
          isPhone={isPhone}
        />
      );
    case SOURCE_PICKER.TITLE_MENU:
      return (
        <SourceTitleMenu
          sources={sources}
          activeId={activeId}
          onChange={onChange}
          catalog={catalog}
        />
      );
    case SOURCE_PICKER.DRAWER:
      return (
        <SourceDrawerPicker
          sources={sources}
          activeId={activeId}
          onChange={onChange}
          isPhone={isPhone}
        />
      );
  }
}

export default SourcePickerControl;
