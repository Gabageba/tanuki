import { useState, type ReactNode } from 'react';
import { Badge, Button, Group, Popover, Stack } from '@mantine/core';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';

type Props<T> = {
  title: string;
  icon: ReactNode;
  value: T[];
  onApply: (value: T[]) => void;
  renderList: (draft: T[], setDraft: (value: T[]) => void) => ReactNode;
};

/** F5 — кнопка-дропдаун одной группы: внутри чекбоксы и «Применить», счётчик на кнопке. */
function FilterMenuButton<T>({ title, icon, value, onApply, renderList }: Props<T>) {
  const [isOpened, setIsOpened] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <Popover
      opened={isOpened}
      onChange={setIsOpened}
      position="bottom-start"
      shadow="md"
      withinPortal={false}
    >
      <Popover.Target>
        <Button
          variant={value.length ? 'light' : 'default'}
          leftSection={icon}
          rightSection={
            <Group gap={6} wrap="nowrap">
              {value.length > 0 && (
                <Badge variant="muted" size="sm" ff="monospace" circle>
                  {value.length}
                </Badge>
              )}
              <CaretDownIcon />
            </Group>
          }
          onClick={() => {
            setDraft(value);
            setIsOpened((prev) => !prev);
          }}
        >
          {title}
        </Button>
      </Popover.Target>
      <Popover.Dropdown miw={220}>
        <Stack gap="sm">
          {renderList(draft, setDraft)}
          <Button
            size="xs"
            leftSection={<CheckIcon />}
            onClick={() => {
              onApply(draft);
              setIsOpened(false);
            }}
          >
            Применить
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export default FilterMenuButton;
