import { Stack, Text } from '@mantine/core';
import type { HomeSection } from '@tanuki/contracts';
import type { ResolvedBookmarkFolder } from '@/entities/bookmark/models';
import TitleCardsScroller from '@/entities/title/card/TitleCardsScroller';

type Props = {
  section: HomeSection;
  getBookmarkFolder: (titleId: string) => ResolvedBookmarkFolder | null;
};

/** Блок с главной сайта: его название, как у сайта, — ступенью ниже названия источника, под
 *  ним лента обложек. Короткий блок — короткая лента (K1). */
function SectionRibbon({ section, getBookmarkFolder }: Props) {
  return (
    <Stack gap="xs" miw={0}>
      <Text fz="sm" fw={600} lh="tight">
        {section.title}
      </Text>
      <TitleCardsScroller items={section.items} getBookmarkFolder={getBookmarkFolder} />
    </Stack>
  );
}

export default SectionRibbon;
