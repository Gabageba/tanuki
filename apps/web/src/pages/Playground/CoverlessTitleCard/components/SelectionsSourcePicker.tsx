import { Menu, UnstyledButton } from '@mantine/core';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import SourceTitle from '@/entities/source/components/SourceTitle';
import { SOURCE } from '../mocks';

/** Локальная копия SourcePicker: страницы не импортируют другие страницы. */
function SelectionsSourcePicker() {
  return (
    <Menu position="bottom-start" width={280} shadow="md">
      <Menu.Target>
        <UnstyledButton miw={0} maw="100%" p={6} m={-6} bdrs="md" aria-label="Сменить источник">
          <SourceTitle
            source={SOURCE}
            rightSection={<CaretDownIcon size={16} style={{ flex: 'none' }} />}
          />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown mah={360} style={{ overflowY: 'auto' }}>
        <Menu.Item
          className="selectable-option"
          data-checked
          leftSection={<SourceIcon id={SOURCE.id} title={SOURCE.title} size={20} radius="sm" />}
          rightSection={<CheckIcon color="var(--mantine-primary-color-filled)" />}
        >
          {SOURCE.title}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default SelectionsSourcePicker;
