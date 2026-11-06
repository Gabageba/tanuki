import { Box, Group } from '@mantine/core';
import TitleAdultTag from '@/entities/title/markers/TitleAdultTag';
import TitleCardName from '../TitleCardName/TitleCardName';
import type { TitleCardData } from '../../models';

type Props = { data: TitleCardData };

function TitleCardNameRow({ data }: Props) {
  return (
    <Group data-card-name-row gap={8} wrap="nowrap" align="flex-start" fz="sm" lh="tight">
      <Box flex={1} miw={0}>
        <TitleCardName data={data} />
      </Box>
      <TitleAdultTag contentRating={data.contentRating} />
    </Group>
  );
}

export default TitleCardNameRow;
