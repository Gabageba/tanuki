import { SegmentedControl } from '@mantine/core';
import { RowsIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { VIEW_MODE, ViewModeSchema, type ViewMode } from '@tanuki/contracts';

type Props = {
  value: ViewMode;
  onChange: (viewMode: ViewMode) => void;
};

/** Сетка или список карточек — один переключатель для каталога и закладок. */
function ViewModeSwitch({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <SegmentedControl
      value={value}
      onChange={(nextValue) => {
        const parsed = ViewModeSchema.safeParse(nextValue);
        if (parsed.success) onChange(parsed.data);
      }}
      data={[
        { label: <SquaresFourIcon size={18} aria-label={t('grid')} />, value: VIEW_MODE.GRID },
        { label: <RowsIcon size={18} aria-label={t('list')} />, value: VIEW_MODE.LIST },
      ]}
    />
  );
}

export default ViewModeSwitch;
