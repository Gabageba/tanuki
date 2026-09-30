import { Button, Radio, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { Source, SourceAccount, SourceAuthFamily } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import ImportSourceFamily from './ImportSourceFamily';

type Props = {
  families: { family: SourceAuthFamily; title: string; sources: Source[] }[];
  accounts: SourceAccount[];
  sourceId: string | null;
  onSourceChange: (sourceId: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

/** Первый шаг импорта: с какого источника забрать закладки. */
function ImportSourceStep({
  families,
  accounts,
  sourceId,
  onSourceChange,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();

  return (
    <Stack>
      <Text fz={13} c="dimmed">
        {t('importIsAvailableWhereLoggedIn')}
      </Text>
      <Radio.Group value={sourceId} onChange={onSourceChange}>
        <Stack gap="md">
          {families.map((item) => (
            <ImportSourceFamily
              key={item.family}
              title={item.title}
              sources={item.sources}
              account={accounts.find((account) => account.family === item.family)}
              sourceId={sourceId}
            />
          ))}
        </Stack>
      </Radio.Group>
      <ModalButtonsLayout>
        <Button variant="default" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button leftSection={<MagnifyingGlassIcon />} disabled={!sourceId} onClick={onSubmit}>
          {t('findBookmarks')}
        </Button>
      </ModalButtonsLayout>
    </Stack>
  );
}

export default ImportSourceStep;
