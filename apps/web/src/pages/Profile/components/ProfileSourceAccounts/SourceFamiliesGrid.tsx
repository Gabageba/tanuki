import { SimpleGrid, Stack, useMatches } from '@mantine/core';
import type { SourceAccount, SourcesResponse } from '@tanuki/contracts';
import SourceLoginBadgeLegend from '@/entities/source/components/SourceLoginBadge/SourceLoginBadgeLegend';
import { getPresentSourceLoginMarks } from '@/entities/source/lib';
import { groupSourcesByAccount } from './lib';
import SourceFamilySection from './SourceFamilySection';

type Props = {
  sourcesData: SourcesResponse;
  accounts: SourceAccount[];
  isLinkingAvailable: boolean;
};

/** Семейства источников с общим аккаунтом в колонках, под ними — легенда значков входа. */
function SourceFamiliesGrid({ sourcesData, accounts, isLinkingAvailable }: Props) {
  const columnCount = useMatches({ base: 1, md: 2 });
  const accountGroups = groupSourcesByAccount(sourcesData);

  return (
    <Stack gap={6}>
      {/* Колонки складываются каждая сама по себе: под коротким семейством не остаётся
      пустоты до высоты соседнего. Порядок по строкам тот же, что у сетки. */}
      <SimpleGrid cols={columnCount} spacing="lg">
        {Array.from({ length: columnCount }, (_, column) => (
          <Stack key={column} gap="lg">
            {accountGroups
              .filter((_, index) => index % columnCount === column)
              .map(({ key, title, family, sources }) => (
                <SourceFamilySection
                  key={key}
                  title={title}
                  family={family}
                  sources={sources}
                  accounts={accounts}
                  isLinkingAvailable={isLinkingAvailable}
                />
              ))}
          </Stack>
        ))}
      </SimpleGrid>
      <SourceLoginBadgeLegend
        marks={getPresentSourceLoginMarks(accountGroups.flatMap((group) => group.sources))}
      />
    </Stack>
  );
}

export default SourceFamiliesGrid;
