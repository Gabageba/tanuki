import { MultiSelect, Pill, type MultiSelectProps } from '@mantine/core';

type Props = Omit<MultiSelectProps, 'value' | 'renderPill' | 'styles'> & {
  value: string[];
};

/**
 * MultiSelect, который не растёт в высоту: в поле только первый выбранный пункт и счётчик
 * остальных «+N», весь выбор виден галочками в списке. Плейсхолдер («Все …») виден только при пустом
 * выборе: Mantine оставляет его и рядом с пилюлями.
 */
function CompactMultiSelect({ value, placeholder, ...props }: Props) {
  const isClearVisible = props.clearable && value.length > 0;

  return (
    <MultiSelect
      value={value}
      placeholder={value.length > 0 ? undefined : placeholder}
      styles={{
        // С кнопкой очистки Mantine отодвигает пилюли и отступом списка, и отступом поля под
        // стрелку — место резервируется дважды. Отступа списка хватает на обе иконки.
        input: isClearVisible ? { '--input-padding-inline-end': '0px' } : undefined,
        pillsList: { flexWrap: 'nowrap', gap: 4 },
      }}
      renderPill={({ option, value: item, onRemove, disabled }) => {
        const index = value.indexOf(item ?? '');
        if (index === 0) {
          return (
            <Pill
              variant="muted"
              flex="0 1 auto"
              miw={0}
              withRemoveButton={!disabled}
              disabled={disabled}
              onRemove={onRemove}
            >
              {option?.label ?? item}
            </Pill>
          );
        }
        if (index === 1) {
          return (
            <Pill variant="muted" flex="none" ff="monospace" disabled={disabled}>
              +{value.length - 1}
            </Pill>
          );
        }
        return null;
      }}
      {...props}
    />
  );
}

export default CompactMultiSelect;
