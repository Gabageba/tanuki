import { Menu, UnstyledButton } from '@mantine/core';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import SourceTitle from '@/entities/source/components/SourceTitle';

type Props = {
  sources: Source[];
  active: Source;
  onChange: (sourceId: string) => void;
};

/**
 * Заголовок источника (S2) — логотип, название, домен — сам кнопка: по клику список источников
 * подборок с логотипами. Пункты как у остальных селектов: выбранный — заливка и рамка акцента и
 * галочка. Название обрезается многоточием, только если места нет.
 */
function SourcePicker({ sources, active, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <Menu position="bottom-start" width={280} shadow="md">
      <Menu.Target>
        <UnstyledButton miw={0} maw="100%" p={6} m={-6} bdrs="md" aria-label={t('changeSource')}>
          <SourceTitle
            source={active}
            rightSection={<CaretDownIcon size={16} style={{ flex: 'none' }} />}
          />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown mah={360} style={{ overflowY: 'auto' }}>
        {sources.map((source) => (
          <Menu.Item
            key={source.id}
            className="selectable-option"
            data-checked={source.id === active.id || undefined}
            leftSection={<SourceIcon id={source.id} title={source.title} size={20} radius="sm" />}
            rightSection={
              source.id === active.id && <CheckIcon color="var(--mantine-primary-color-filled)" />
            }
            onClick={() => onChange(source.id)}
          >
            {source.title}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

export default SourcePicker;
