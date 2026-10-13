import { Stack, Text } from '@mantine/core';
import type { HomeSectionInfo } from '@tanuki/contracts';
import SourceTitleSkeleton from '@/entities/source/components/SourceTitle/SourceTitleSkeleton';
import RibbonSkeleton from './RibbonSkeleton';

type Props = {
  /** Включённые блоки источника — их названия известны без запроса к сайту. */
  sections: HomeSectionInfo[];
};

/** Z1 — заголовок источника скелетоном, настоящие названия блоков и по ленте на блок. */
function SelectionsSourceSkeleton({ sections }: Props) {
  return (
    <Stack gap="md">
      <SourceTitleSkeleton />
      <Stack gap="lg">
        {sections.map((section) => (
          <Stack key={section.id} gap="xs">
            <Text fz="sm" fw={600} lh="tight">
              {section.title}
            </Text>
            <RibbonSkeleton />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

export default SelectionsSourceSkeleton;
