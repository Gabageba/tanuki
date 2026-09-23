import { Button, Group, Stack, Title as Heading } from '@mantine/core';
import { useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { isStaffRole, type Title } from '@tanuki/contracts';
import useTitleMatches from '../../hooks/useTitleMatches';
import useSetTitleLink from '../../hooks/useSetTitleLink';
import TitleMatchesSkeleton from './TitleMatchesSkeleton';
import TitleMatchesScroller from './TitleMatchesScroller';
import TitleMatchAddModal from './TitleMatchAddModal';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';

type Props = {
  title: Title;
};

function TitleMatches({ title }: Props) {
  const { t } = useTranslation();
  const { data, isPending: isMatchesPending } = useTitleMatches({ titleId: title.id });
  const { mutate: mutateTitleLink, isPending: isTitleLinkPending } = useSetTitleLink({
    titleId: title.id,
  });
  const { data: user } = useCurrentUser();
  const isStaff = isStaffRole(user?.role);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isMatchesPending) {
    return <TitleMatchesSkeleton />;
  }

  return (
    <Stack gap={8}>
      <Group gap={8} justify="space-between">
        <Heading order={5}>{t('foundOnOtherSources')}</Heading>
        {isStaff && (
          <Button
            size="xs"
            variant="default"
            leftSection={<PlusIcon />}
            loading={isTitleLinkPending}
            onClick={() => setIsAddModalOpen(true)}
          >
            {t('addManually')}
          </Button>
        )}
      </Group>

      <TitleMatchesScroller
        matches={data?.items}
        mutateTitleLink={mutateTitleLink}
        isTitleLinkPending={isTitleLinkPending}
        isStaff={isStaff}
      />
      <TitleMatchAddModal
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mutateTitleLink={mutateTitleLink}
        isTitleLinkPending={isTitleLinkPending}
      />
    </Stack>
  );
}

export default TitleMatches;
