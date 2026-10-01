import type { ReactNode } from 'react';
import { Divider, Group, Radio, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { PRIMARY_COLOR, getMutedBackground } from '@/shared/lib/palette';
import {
  CHOICE_CONTROL,
  ROW_CONTENT_OFFSET,
  type ChoiceControl,
  type ChoiceOption,
} from '../models';
import CardsRadioGroup from './CardsRadioGroup';
import SettingRow from './SettingRow';

type Props = {
  control: ChoiceControl;
  icon: ReactNode;
  title: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
  narrow: boolean;
};

/** Выбор одного из значений — режима чтения или масштаба — одним из способов оси C. */
function ChoiceSetting({ control, icon, title, value, options, onChange, narrow }: Props) {
  const selected = options.find((option) => option.value === value);

  switch (control) {
    case CHOICE_CONTROL.CARDS:
      return (
        <SettingRow icon={icon} title={title} narrow={narrow}>
          <CardsRadioGroup value={value} items={toCardItems(options)} onChange={onChange} />
        </SettingRow>
      );
    case CHOICE_CONTROL.SEGMENTED:
      return (
        <SettingRow
          icon={icon}
          title={title}
          description={selected?.description}
          isActionWide
          narrow={narrow}
          action={
            <SegmentedControl
              fullWidth={narrow}
              value={value}
              onChange={onChange}
              data={options.map((option) => ({
                value: option.value,
                label: (
                  <Group gap={6} wrap="nowrap" justify="center">
                    {option.icon}
                    <Text fz="sm">{option.title}</Text>
                  </Group>
                ),
              }))}
            />
          }
        />
      );
    case CHOICE_CONTROL.SELECT:
      return (
        <SettingRow
          icon={icon}
          title={title}
          description={selected?.description}
          isActionWide
          narrow={narrow}
          action={
            <Select
              w={narrow ? '100%' : 190}
              value={value}
              onChange={(next) => next && onChange(next)}
              data={options.map((option) => ({ value: option.value, label: option.title }))}
              leftSection={selected?.icon}
              allowDeselect={false}
            />
          }
        />
      );
    case CHOICE_CONTROL.RADIO_ROWS:
      return (
        <Stack gap={0}>
          <SettingRow icon={icon} title={title} narrow={narrow} />
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Stack key={option.value} gap={0}>
                <Divider ml={ROW_CONTENT_OFFSET + 16} />
                <Radio.Card
                  checked={isSelected}
                  onClick={() => onChange(option.value)}
                  withBorder={false}
                  radius={0}
                  pl={ROW_CONTENT_OFFSET + 16}
                  pr="md"
                  py="xs"
                  bg={isSelected ? getMutedBackground(PRIMARY_COLOR, true) : undefined}
                >
                  <Group justify="space-between" gap="md" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap" align="flex-start" flex={1} miw={0}>
                      <Text component="div" c="dimmed" lh={0} fz={18}>
                        {option.icon}
                      </Text>
                      <Stack gap={4} miw={0}>
                        <Text lh="tight" fz={14}>
                          {option.title}
                        </Text>
                        <Text fz={12} c="dimmed" lh="tight">
                          {option.description}
                        </Text>
                      </Stack>
                    </Group>
                    <Radio.Indicator variant="outline" />
                  </Group>
                </Radio.Card>
              </Stack>
            );
          })}
        </Stack>
      );
  }
}

const toCardItems = (options: ChoiceOption[]) =>
  options.map(({ value, title, description, icon }) => ({ id: value, title, description, icon }));

export default ChoiceSetting;
