import { Button, Group, Stack, Title as Heading } from '@mantine/core';
import { useState } from 'react';
import { ArrowLeftIcon, CheckSquareIcon, PlusIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { isStaffRole, type Title } from '@tanuki/contracts';
import useTitleMatches from '../../hooks/useTitleMatches';
import TitleMatchesSkeleton from './TitleMatchesSkeleton';
import TitleMatchesScroller from './TitleMatchesScroller';
import TitleMatchAddModal from './TitleMatchAddModal';
import TitleLinkBookmarkModal from './TitleLinkBookmarkModal';
import TitleMatchBatchActions from './TitleMatchBatchActions';
import useTitleMatchReview from './hooks/useTitleMatchReview';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import QueryBlock from '@/shared/ui/QueryBlock';
import { toOptionalQuery } from '@/shared/ui/QueryBlock/lib';

type Props = {
  title: Title;
};

function TitleMatches({ title }: Props) {
  const { t } = useTranslation();
  const matchesQuery = useTitleMatches({ titleId: title.id });
  const review = useTitleMatchReview({ titleId: title.id, matches: matchesQuery.data?.items });
  const { data: user } = useCurrentUser();
  const isStaff = isStaffRole(user?.role);
  const isChecking = isStaff && review.isChecking;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const addLink = async (targetId: string) => {
    if (await review.addLink(targetId)) setIsAddModalOpen(false);
  };

  return (
    <>
      <Stack gap={8}>
        {/* Заголовок и ручное добавление известны до ответа; скелетон нужен только ленте. */}
        <Group gap={8} justify="space-between">
          <Heading order={5}>{t('foundOnOtherSources')}</Heading>
          {isStaff && (
            <Group gap={8} w={{ base: '100%', xs: 'auto' }}>
              <Button
                w={{ base: '100%', xs: 'auto' }}
                size="xs"
                variant="default"
                leftSection={isChecking ? <ArrowLeftIcon /> : <CheckSquareIcon />}
                disabled={review.isPending}
                onClick={review.toggleChecking}
              >
                {isChecking ? t('backToViewing') : t('checkLinks')}
              </Button>
              <Button
                w={{ base: '100%', xs: 'auto' }}
                size="xs"
                variant="default"
                leftSection={<PlusIcon />}
                disabled={review.isPending}
                onClick={() => setIsAddModalOpen(true)}
              >
                {t('addManually')}
              </Button>
            </Group>
          )}
        </Group>
        <QueryBlock query={toOptionalQuery(matchesQuery)} skeleton={<TitleMatchesSkeleton />}>
          {(data) => (
            <Stack gap={8}>
              <TitleMatchesScroller
                matches={data?.items}
                isChecking={isChecking}
                selectedTargetIds={review.selectedTargetIds}
                disabled={review.isPending}
                onToggle={review.toggleSelection}
              />
              {isChecking && (
                <TitleMatchBatchActions
                  selectedCount={review.selectedTargetIds.length}
                  pendingVerdict={review.pendingVerdict}
                  onSave={review.saveSelection}
                  onClear={review.clearSelection}
                />
              )}
            </Stack>
          )}
        </QueryBlock>
      </Stack>
      <TitleMatchAddModal
        opened={isAddModalOpen && !review.conflictTargetId}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addLink}
        isPending={review.isPending}
      />
      {review.conflictTargetId && (
        <TitleLinkBookmarkModal
          titleId={title.id}
          targetId={review.conflictTargetId}
          isPending={review.isLinkPending}
          onClose={review.cancelConflict}
          onSubmit={review.chooseFolder}
        />
      )}
    </>
  );
}

export default TitleMatches;
