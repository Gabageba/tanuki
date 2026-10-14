import type { Source } from '@tanuki/contracts';
import { SOURCE_PICKER, type SourcePicker as SourcePickerKind } from '../models';
import SourcePickerChips from './SourcePickerChips';
import SourcePickerLogos from './SourcePickerLogos';
import SourcePickerSelect from './SourcePickerSelect';

type Props = {
  kind: SourcePickerKind;
  sources: Source[];
  activeId: string;
  onChange: (sourceId: string) => void;
};

/** Выбор источника подборок в виде, который задаёт вариант P3. */
function SourcePicker({ kind, ...props }: Props) {
  switch (kind) {
    case SOURCE_PICKER.CHIPS:
      return <SourcePickerChips {...props} />;
    case SOURCE_PICKER.SELECT:
      return <SourcePickerSelect {...props} />;
    case SOURCE_PICKER.LOGOS:
      return <SourcePickerLogos {...props} />;
  }
}

export default SourcePicker;
