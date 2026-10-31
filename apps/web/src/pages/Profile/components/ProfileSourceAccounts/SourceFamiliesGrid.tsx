import { Stack } from '@mantine/core';
import type { SourceAccount, SourcesResponse } from '@tanuki/contracts';
import SourceLoginBadgeLegend from '@/entities/source/components/SourceLoginBadge/SourceLoginBadgeLegend';
import { getPresentSourceLoginMarks } from '@/entities/source/lib';
import { groupSourcesByAccount } from '@/entities/source-account/lib';
import SourceFamilySection from './SourceFamilySection';

type Props = {
  sourcesData: SourcesResponse;
  accounts: SourceAccount[];
  isLinkingAvailable: boolean;
};

/** Семейства в порядке пользователя: аккаунт слева, источники справа, легенда под списком. */
function SourceFamiliesGrid({ sourcesData, accounts, isLinkingAvailable }: Props) {
  const accountGroups = groupSourcesByAccount(sourcesData);

  return (
    <Stack gap={6}>
      <Stack gap="lg">
        {accountGroups.map(({ key, title, family, sources }) => (
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
      <SourceLoginBadgeLegend
        marks={getPresentSourceLoginMarks(accountGroups.flatMap((group) => group.sources))}
      />
    </Stack>
  );
}

export default SourceFamiliesGrid;
