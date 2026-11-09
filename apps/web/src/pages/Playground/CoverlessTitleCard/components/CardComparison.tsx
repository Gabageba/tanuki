import { Stack } from '@mantine/core';
import type { CardOptions, Example } from '../models';
import CoverlessFeed from './CoverlessFeed';
import PreviewFrame from './PreviewFrame';

type Props = CardOptions & { examples: Example[]; wide?: boolean };

function CardComparison({ examples, wide, ...options }: Props) {
  return (
    <Stack gap="md">
      <PreviewFrame phone={false} wide={wide}>
        <CoverlessFeed phone={false} examples={examples} {...options} />
      </PreviewFrame>
      <PreviewFrame phone>
        <CoverlessFeed phone examples={examples} {...options} />
      </PreviewFrame>
    </Stack>
  );
}

export default CardComparison;
