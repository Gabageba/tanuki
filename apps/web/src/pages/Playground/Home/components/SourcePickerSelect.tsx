import { Button, Menu } from '@mantine/core';
import { CaretDownIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';

type Props = {
  sources: Source[];
  activeId: string;
  onChange: (sourceId: string) => void;
};

/** P3b — выбранный источник кнопкой со списком, как выбор источника в шапке. */
function SourcePickerSelect({ sources, activeId, onChange }: Props) {
  const active = sources.find((source) => source.id === activeId) ?? sources[0];

  if (!active) {
    return null;
  }

  return (
    <Menu position="bottom-start" width={260}>
      <Menu.Target>
        <Button
          variant="default"
          w="fit-content"
          fz={16}
          leftSection={<SourceIcon id={active.id} title={active.title} size={20} />}
          rightSection={<CaretDownIcon />}
        >
          {active.title}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {sources.map((source) => (
          <Menu.Item
            key={source.id}
            leftSection={<SourceIcon id={source.id} title={source.title} size={20} />}
            onClick={() => onChange(source.id)}
            bg={source.id === active.id ? 'var(--mantine-primary-color-light)' : undefined}
          >
            {source.title}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

export default SourcePickerSelect;
