import { Box, Group, Stack, Text } from '@mantine/core';
import { TITLE_CARD_LIST_SIZE } from '@/entities/title/card/TitleCard/models';
import {
  DESKTOP_CARD_WIDTH,
  MOBILE_CARD_WIDTH,
  type MarkerExample,
  type MarkerVariant,
} from '../models';
import MarkerExampleCard from './MarkerExampleCard';

type Props = { examples: MarkerExample[]; variant?: MarkerVariant; chosen?: boolean };

function MarkerComparison({ examples, variant, chosen }: Props) {
  return (
    <Group align="flex-start" gap="xl" maw={DESKTOP_CARD_WIDTH + MOBILE_CARD_WIDTH + 64}>
      <Stack gap="sm" w={DESKTOP_CARD_WIDTH} maw="100%">
        <Text fz="xs" c="dimmed">
          Каталог · обложка 120 px
        </Text>
        {examples.map((example) => (
          <MarkerExampleCard
            key={example.title.id}
            example={example}
            variant={variant}
            chosen={chosen}
            listSize={TITLE_CARD_LIST_SIZE.REGULAR}
          />
        ))}
      </Stack>
      <Box w={MOBILE_CARD_WIDTH} maw="100%">
        <Stack gap="sm">
          <Text fz="xs" c="dimmed">
            Новые главы · обложка 84 px · ширина 320 px
          </Text>
          {examples.map((example) => (
            <MarkerExampleCard
              key={example.title.id}
              example={example}
              variant={variant}
              chosen={chosen}
              listSize={TITLE_CARD_LIST_SIZE.COMPACT}
            />
          ))}
        </Stack>
      </Box>
    </Group>
  );
}

export default MarkerComparison;
