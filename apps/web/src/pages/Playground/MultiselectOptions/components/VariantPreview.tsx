import { SimpleGrid, Stack } from '@mantine/core';
import MockDropdown from './MockDropdown';
import LiveFields from './LiveFields';
import type { MockList, OptionFocus, OptionLook } from '../models';

type Props = {
  lists: MockList[];
  look: OptionLook;
  focus: OptionFocus;
};

/** Застывшие списки в нескольких состояниях и под ними — живые поля того же варианта. */
function VariantPreview({ lists, look, focus }: Props) {
  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="lg" maw={1140}>
        {lists.map((list) => (
          <MockDropdown key={list.title} list={list} look={look} focus={focus} />
        ))}
      </SimpleGrid>
      <LiveFields look={look} focus={focus} />
    </Stack>
  );
}

export default VariantPreview;
