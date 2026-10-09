import { useContext, useMemo, useState } from 'react';
import { Badge, Button, Card, Group, Stack, Tabs, Text } from '@mantine/core';
import {
  BooksIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckIcon,
  CircleHalfIcon,
  FunnelIcon,
  ShapesIcon,
} from '@phosphor-icons/react';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import { countFilters, STATE_OPTIONS, TYPE_OPTIONS } from '../lib';
import { PRESET_FILTERS } from '../models';
import FilterPills from './FilterPills';
import FiltersButton from './FiltersButton';
import OptionCheckList from './OptionCheckList';
import ResultsPreview from './ResultsPreview';
import SourceCheckList from './SourceCheckList';

/** F2 — как в каталоге: кнопка раскрывает карточку с вертикальными вкладками групп,
 *  выбор применяется пачкой по «Применить». */
function FiltersCatalogCard() {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);
  const [filters, setFilters] = useState(PRESET_FILTERS);
  const [draft, setDraft] = useState(PRESET_FILTERS);
  const [isOpened, setIsOpened] = useState(true);

  const TABS = useMemo(
    () => [
      {
        id: 'sources',
        title: 'Источники',
        icon: <BooksIcon />,
        count: draft.sources.length,
        content: (
          <SourceCheckList
            value={draft.sources}
            onChange={(sources) => setDraft({ ...draft, sources })}
          />
        ),
      },
      {
        id: 'types',
        title: 'Тип',
        icon: <ShapesIcon />,
        count: draft.types.length,
        content: (
          <OptionCheckList
            options={TYPE_OPTIONS}
            value={draft.types}
            onChange={(types) => setDraft({ ...draft, types })}
          />
        ),
      },
      {
        id: 'states',
        title: 'Статус',
        icon: <CircleHalfIcon />,
        count: draft.states.length,
        content: (
          <OptionCheckList
            options={STATE_OPTIONS}
            value={draft.states}
            onChange={(states) => setDraft({ ...draft, states })}
          />
        ),
      },
    ],
    [draft],
  );

  if (isPhone) {
    return (
      <Stack gap="sm">
        <FiltersButton count={countFilters(filters)} />
        <FilterPills filters={filters} onChange={setFilters} />
        <ResultsPreview />
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <Group gap="sm">
        <Button
          leftSection={<FunnelIcon />}
          rightSection={isOpened ? <CaretUpIcon /> : <CaretDownIcon />}
          onClick={() => {
            setDraft(filters);
            setIsOpened((prev) => !prev);
          }}
        >
          Фильтры
        </Button>
        <FilterPills filters={filters} onChange={setFilters} />
      </Group>
      {isOpened && (
        <Card withBorder p={0}>
          <Tabs defaultValue="sources" orientation="vertical" radius={0}>
            <Tabs.List w={220}>
              {TABS.map(({ id, title, icon, count }) => (
                <Tabs.Tab key={id} value={id} leftSection={icon}>
                  <Group gap="xs" justify="space-between" wrap="nowrap">
                    {title}
                    {count > 0 && (
                      <Badge variant="muted" size="sm" ff="monospace" circle>
                        {count}
                      </Badge>
                    )}
                  </Group>
                </Tabs.Tab>
              ))}
            </Tabs.List>
            {TABS.map(({ id, title, content }) => (
              <Tabs.Panel key={id} value={id} p="sm">
                <Stack>
                  <Text fw={600}>{title}</Text>
                  {content}
                  <Group justify="flex-end">
                    <Button variant="subtle" color="gray" onClick={() => setIsOpened(false)}>
                      Отмена
                    </Button>
                    <Button
                      leftSection={<CheckIcon />}
                      onClick={() => {
                        setFilters(draft);
                        setIsOpened(false);
                      }}
                    >
                      Применить
                    </Button>
                  </Group>
                </Stack>
              </Tabs.Panel>
            ))}
          </Tabs>
        </Card>
      )}
      <ResultsPreview />
    </Stack>
  );
}

export default FiltersCatalogCard;
