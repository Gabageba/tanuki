import { useState } from 'react';
import {
  Alert,
  Anchor,
  Badge,
  Container,
  Grid,
  Group,
  Image,
  List,
  Loader,
  SegmentedControl,
  Text,
  Title as Heading,
} from '@mantine/core';
import { WarningIcon } from '@phosphor-icons/react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { TITLE_RESTRICTION, type TitleRestriction } from '@tanuki/contracts';
import useChapters from './hooks/useChapters';
import useTitleDetails from './hooks/useTitleDetails';
import ApiErrorText from '@/shared/ui/ApiErrorText';
import { STATUS_DOWN_COLOR } from '@/shared/lib/palette';

const getRestrictionMessage = (restriction: TitleRestriction, t: TFunction): string => {
  switch (restriction) {
    case TITLE_RESTRICTION.GEO:
      return t('chaptersGeoRestricted');
    case TITLE_RESTRICTION.LEGAL:
      return t('chaptersBlockedByRightsHolder');
    case TITLE_RESTRICTION.PAYWALL:
      return t('allChaptersPaid');
  }
};

function TitlePage() {
  const { t } = useTranslation();
  const { titleId = '' } = useParams<{ titleId: string }>();
  const { data, error, isPending, isError } = useTitleDetails({ titleId });
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const branches = data?.branches ?? [];
  const branchId = selectedBranchId ?? branches[0]?.id ?? null;
  const selectedBranch = branches.find((branch) => branch.id === branchId);
  const { data: chaptersData, isPending: chaptersPending } = useChapters({
    titleId,
    branch: selectedBranch?.name ?? undefined,
  });
  const chapters = chaptersData?.items.slice().reverse() ?? [];

  if (isPending) {
    return (
      <Container py="xl">
        <Loader />
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container py="xl">
        <ApiErrorText error={error} />
      </Container>
    );
  }

  const { title } = data;

  return (
    <Container py="xl">
      <Grid>
        <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
          <Image src={title.largeCoverUrl || title.coverUrl} alt={title.name} radius="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 8, md: 9 }}>
          <Heading order={1}>{title.name}</Heading>
          {title.authors.length > 0 && <Text c="dimmed">{title.authors.join(', ')}</Text>}
          {title.restriction && (
            <Alert color={STATUS_DOWN_COLOR} icon={<WarningIcon weight="fill" />} mt="sm" py={8}>
              {getRestrictionMessage(title.restriction, t)}
            </Alert>
          )}
          <Group gap="xs" my="sm">
            {title.tags.map((tag) => (
              <Badge key={tag.id} variant="light">
                {tag.title}
              </Badge>
            ))}
          </Group>
          {title.description && <Text>{title.description}</Text>}
          <Anchor
            href={title.publicUrl}
            target="_blank"
            rel="noreferrer nofollow"
            mt="sm"
            display="inline-block"
          >
            {t('readOnSource')}
          </Anchor>
        </Grid.Col>
      </Grid>

      {branches.length > 1 && (
        <SegmentedControl
          mt="lg"
          value={branchId ?? undefined}
          onChange={setSelectedBranchId}
          data={branches.map((branch) => ({
            value: branch.id,
            label: branch.name ?? t('main'),
          }))}
        />
      )}

      <Heading order={2} mt="lg" mb="sm">
        {t('chapters')}
      </Heading>
      {chaptersPending && <Loader />}
      <List spacing="xs" listStyleType="none">
        {chapters.map((chapter) => (
          <List.Item key={chapter.id}>
            <Anchor component={Link} to={`/title/${titleId}/read/${chapter.id}`}>
              {chapter.title || t('chapterNumber', { number: chapter.number ?? '?' })}
            </Anchor>
          </List.Item>
        ))}
      </List>
    </Container>
  );
}

export default TitlePage;
