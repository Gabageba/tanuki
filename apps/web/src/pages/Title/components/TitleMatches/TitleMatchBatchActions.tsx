import { Button, Divider, Flex, Group, Stack, Text } from '@mantine/core';
import { SelectionSlashIcon, ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { TITLE_LINK_VERDICT, type TitleLinkVerdict } from '@tanuki/contracts';

type Props = {
  selectedCount: number;
  pendingVerdict: TitleLinkVerdict | null;
  onSave: (verdict: TitleLinkVerdict) => Promise<boolean>;
  onClear: () => void;
};

function TitleMatchBatchActions({ selectedCount, pendingVerdict, onSave, onClear }: Props) {
  const { t } = useTranslation();
  if (selectedCount === 0) return null;
  const disabled = pendingVerdict !== null;

  return (
    <Stack gap="md" mt="sm">
      <Divider />
      <Flex
        gap={8}
        direction={{ base: 'column', xs: 'row' }}
        align={{ base: 'stretch', xs: 'flex-start' }}
      >
        <Text fz="sm" aria-live="polite" flex="none" pt={{ base: 0, xs: 4 }}>
          {t('selectedCount', { count: selectedCount })}
        </Text>
        <Group gap="xs" justify="flex-end" flex={1} miw={0}>
          <Button
            size="xs"
            color="moss"
            w={{ base: '100%', xs: 'auto' }}
            leftSection={<ThumbsUpIcon />}
            disabled={disabled}
            loading={pendingVerdict === TITLE_LINK_VERDICT.CONFIRMED}
            onClick={() => onSave(TITLE_LINK_VERDICT.CONFIRMED)}
          >
            {t('confirmLinks')}
          </Button>
          <Button
            size="xs"
            color="crimson"
            w={{ base: '100%', xs: 'auto' }}
            leftSection={<ThumbsDownIcon />}
            disabled={disabled}
            loading={pendingVerdict === TITLE_LINK_VERDICT.REJECTED}
            onClick={() => onSave(TITLE_LINK_VERDICT.REJECTED)}
          >
            {t('rejectLinks')}
          </Button>
          <Button
            size="xs"
            variant="default"
            w={{ base: '100%', xs: 'auto' }}
            leftSection={<SelectionSlashIcon />}
            disabled={disabled}
            onClick={onClear}
          >
            {t('clearSelection')}
          </Button>
        </Group>
      </Flex>
    </Stack>
  );
}

export default TitleMatchBatchActions;
