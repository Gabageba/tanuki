import { Combobox, Input, InputBase, useCombobox, type MantineStyleProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { SORT_DIRECTION, SortDirectionSchema, type SortDirection } from '@tanuki/contracts';
import ComboboxOption from '@/shared/ui/option/ComboboxOption';
import { getSortDirectionLabel, type SortOption } from './models';
import SortDirectionIcon from './SortDirectionIcon';

type Props<T extends string> = {
  options: SortOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  /** Нет — направление не выбирается: ни иконки слева, ни пунктов направления внизу списка. */
  direction?: SortDirection;
  onDirectionChange?: (direction: SortDirection) => void;
} & Pick<MantineStyleProps, 'w' | 'miw' | 'flex'>;

/** Поле сортировки: порядок в списке, направление — двумя пунктами в его подвале. */
function SortCombobox<T extends string>({
  options,
  value,
  onChange,
  direction,
  onDirectionChange,
  ...styleProps
}: Props<T>) {
  const { t } = useTranslation();
  const combobox = useCombobox();
  const selected = options.find((option) => option.value === value);

  return (
    <Combobox
      store={combobox}
      floatingHeight="viewport"
      onOptionSubmit={(submitted) => {
        const parsedDirection = SortDirectionSchema.safeParse(submitted);
        if (parsedDirection.success) {
          onDirectionChange?.(parsedDirection.data);
          return;
        }
        const option = options.find((item) => item.value === submitted);
        if (option) {
          onChange(option.value);
          combobox.closeDropdown();
        }
      }}
    >
      <Combobox.Target>
        <InputBase
          {...styleProps}
          component="button"
          type="button"
          size="sm"
          pointer
          rightSection={<Combobox.Chevron />}
          leftSection={direction && <SortDirectionIcon direction={direction} />}
          rightSectionPointerEvents="none"
          aria-label={t('sort')}
          onClick={() => combobox.toggleDropdown()}
        >
          {selected ? selected.label : <Input.Placeholder>{t('sort')}</Input.Placeholder>}
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {options.map((option) => (
            <ComboboxOption
              key={option.value}
              label={option.label}
              value={option.value}
              selected={option.value === value}
            />
          ))}
        </Combobox.Options>
        {direction && (
          <Combobox.Footer p={4}>
            {[SORT_DIRECTION.DESC, SORT_DIRECTION.ASC].map((item) => (
              <ComboboxOption
                key={item}
                label={getSortDirectionLabel(item, t)}
                value={item}
                selected={item === direction}
              />
            ))}
          </Combobox.Footer>
        )}
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default SortCombobox;
