import { Stack, Text } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import Mdash from '@/shared/ui/Mdash';
import { isEmpty } from '@/shared/lib/isEmpty';

type MetaItemValue = ReactNode | ReactNode[];

type Props<T extends MetaItemValue = MetaItemValue> = {
  label: string;
  value: T | null;
  description?: string[];
};

function MangaMetaItem<T extends MetaItemValue = MetaItemValue>({
  label,
  value: rawValue,
}: Props<T>) {
  const value = useMemo(() => {
    if (Array.isArray(rawValue)) {
      return <MidDotGroup items={rawValue.filter(Boolean)} text={{ lh: 1 }} />;
    }

    return rawValue;
  }, [rawValue]);

  return (
    <Stack gap={8}>
      <Text lh={1} c="dimmed" fz={12}>
        {label}
      </Text>
      <Text lh={1}>{isEmpty(value) ? <Mdash /> : value}</Text>
    </Stack>
  );
}

export default MangaMetaItem;
