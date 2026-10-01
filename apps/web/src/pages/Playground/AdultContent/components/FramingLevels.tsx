import { SegmentedControl, Stack } from '@mantine/core';
import { EyeIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import {
  getAdultLevel,
  getAllReveal,
  getLevelDescription,
  getLevelLabel,
  getLevelSettings,
  getTitlesReveal,
} from '../lib';
import { ADULT_LEVEL, type AdultLevel, type FramingRenderProps } from '../models';
import PreviewRow from './PreviewRow';

type Props = FramingRenderProps;

const LEVELS = Object.values(ADULT_LEVEL);

/** F3: одна строка, три уровня вместо двух тумблеров — зависимости между настройками нет. */
function FramingLevels({ settings, term, onChange, onReveal }: Props) {
  const level = getAdultLevel(settings);

  const handleChange = (value: string) => {
    const next = value as AdultLevel;
    const patch = getLevelSettings(next);
    // Выше по шкале — открыть больше 18+, это только через подтверждение.
    if (LEVELS.indexOf(next) <= LEVELS.indexOf(level)) return onChange(patch);
    onReveal(patch, next === ADULT_LEVEL.ALL ? getAllReveal(term) : getTitlesReveal(term));
  };

  return (
    <GroupedList label="Контент 18+">
      <GroupedList.Row
        icon={<EyeIcon />}
        title="Показывать 18+"
        description={
          <Stack gap={8} mt={4}>
            <SegmentedControl
              size="xs"
              w="fit-content"
              value={level}
              onChange={handleChange}
              data={LEVELS.map((value) => ({ value, label: getLevelLabel(value) }))}
            />
            {getLevelDescription(level, term)}
          </Stack>
        }
      />
      <PreviewRow settings={settings} withDate={false} />
    </GroupedList>
  );
}

export default FramingLevels;
