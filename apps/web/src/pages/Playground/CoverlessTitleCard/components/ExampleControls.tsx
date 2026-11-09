import { Button, Group, Select, useMantineColorScheme } from '@mantine/core';
import { CardsIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import SandboxOnly from '../../components/SandboxOnly';
import { EXAMPLE_SET, type ExampleSet } from '../models';

type Props = { value: ExampleSet; onChange: (value: ExampleSet) => void };

function ExampleControls({ value, onChange }: Props) {
  const { setColorScheme } = useMantineColorScheme();
  return (
    <SandboxOnly>
      <Group gap="sm">
        <Select
          aria-label="Примеры карточек"
          leftSection={<CardsIcon />}
          value={value}
          allowDeselect={false}
          w={250}
          data={[
            { value: EXAMPLE_SET.REGULAR, label: 'Обычные данные' },
            { value: EXAMPLE_SET.EDGE, label: 'Длинные и пустые значения' },
            { value: EXAMPLE_SET.SINGLE, label: 'Один тайтл' },
          ]}
          onChange={(next) => {
            switch (next) {
              case EXAMPLE_SET.REGULAR:
              case EXAMPLE_SET.EDGE:
              case EXAMPLE_SET.SINGLE:
                onChange(next);
            }
          }}
        />
        <Button variant="default" leftSection={<SunIcon />} onClick={() => setColorScheme('light')}>
          Светлая тема
        </Button>
        <Button variant="default" leftSection={<MoonIcon />} onClick={() => setColorScheme('dark')}>
          Тёмная тема
        </Button>
      </Group>
    </SandboxOnly>
  );
}

export default ExampleControls;
