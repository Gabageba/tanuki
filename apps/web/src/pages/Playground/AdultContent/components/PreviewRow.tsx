import { Box, Group, Text } from '@mantine/core';
import { isBlurActive } from '../lib';
import { EXAMPLE_TITLES } from '../mocks';
import { BLUR_STYLE, type AdultSettings, type BlurStyle } from '../models';
import MockCover from './MockCover';

type Props = {
  settings: AdultSettings;
  withDate: boolean;
  /** Размыты ли тайтлы 18+; по умолчанию — по логике R/F с главным тумблером. */
  blurred?: boolean;
  blurStyle?: BlurStyle;
};

/** P3/P3b: последняя строка группы — обложки при текущих настройках и подпись к ним. */
function PreviewRow({
  settings,
  withDate,
  blurred = isBlurActive(settings),
  blurStyle = BLUR_STYLE.PLAIN,
}: Props) {
  return (
    <Group gap="md" wrap="nowrap" px="md" py="sm">
      <Group gap={6} wrap="nowrap" flex="none">
        {EXAMPLE_TITLES.map((title) => (
          <Box key={title.id} w={32}>
            <MockCover
              title={title}
              blurred={title.isAdult && blurred}
              blurStyle={blurStyle}
              compact
            />
          </Box>
        ))}
      </Group>
      <Text fz={12} c="dimmed" lh={1.3}>
        Так обложки 18+ выглядят в каталоге при текущих настройках.
        {withDate && settings.showAdultSources && ' Возраст подтверждён 12 марта 2025.'}
      </Text>
    </Group>
  );
}

export default PreviewRow;
