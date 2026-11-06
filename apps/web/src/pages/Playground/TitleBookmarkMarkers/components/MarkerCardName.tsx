import { Box, Group } from '@mantine/core';
import TitleCardName from '@/entities/title/card/TitleCard/components/TitleCardName/TitleCardName';
import type { TitleCardData } from '@/entities/title/card/TitleCard/models';
import { MARKER_VARIANT, type MarkerVariant } from '../models';
import MarkerInlineIcon from './MarkerInlineIcon';

type Props = { data: TitleCardData; variant: MarkerVariant };

function MarkerCardName({ data, variant }: Props) {
  switch (variant) {
    case MARKER_VARIANT.CURRENT:
      return (
        <Group gap={8} wrap="nowrap" align="flex-start">
          <Box flex={1} miw={0}>
            <TitleCardName data={data} />
          </Box>
          <MarkerInlineIcon folder={data.bookmarkFolder} />
        </Group>
      );
    case MARKER_VARIANT.BEFORE_NAME:
      return (
        <Group gap={8} wrap="nowrap" align="flex-start">
          <MarkerInlineIcon folder={data.bookmarkFolder} />
          <Box flex={1} miw={0}>
            <TitleCardName data={data} />
          </Box>
        </Group>
      );
    case MARKER_VARIANT.COVER_FLAG:
    case MARKER_VARIANT.FOLDER_PILL:
      return <TitleCardName data={data} />;
  }
}

export default MarkerCardName;
