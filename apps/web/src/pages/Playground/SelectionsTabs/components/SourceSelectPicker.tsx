import { Group, Select } from '@mantine/core';
import { CheckIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';

type Props = {
  sources: Source[];
  activeId: string;
  onChange: (sourceId: string) => void;
  isPhone: boolean;
};

/** S1 — поле `Select`: логотип выбранного слева, в списке логотипы и поиск по названию. */
function SourceSelectPicker({ sources, activeId, onChange, isPhone }: Props) {
  const active = sources.find(({ id }) => id === activeId);

  return (
    <Select
      aria-label="Источник"
      placeholder="Источник"
      data={sources.map(({ id, title }) => ({ value: id, label: title }))}
      value={activeId}
      onChange={(value) => value && onChange(value)}
      allowDeselect={false}
      searchable
      w={isPhone ? '100%' : 260}
      leftSection={
        active && <SourceIcon id={active.id} title={active.title} size={20} radius="sm" />
      }
      renderOption={({ option, checked }) => {
        const source = sources.find(({ id }) => id === option.value);
        return (
          <Group justify="space-between" w="100%" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              {source && <SourceIcon id={source.id} title={source.title} size={20} radius="sm" />}
              {option.label}
            </Group>
            {checked && <CheckIcon color="var(--mantine-primary-color-filled)" />}
          </Group>
        );
      }}
    />
  );
}

export default SourceSelectPicker;
