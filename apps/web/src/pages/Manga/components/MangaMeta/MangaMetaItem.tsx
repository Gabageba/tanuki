import { Group, Stack, Text } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';
import MidDot from '@/shared/ui/MidDot';
import Mdash from '@/shared/ui/Mdash';
import { isEmpty } from '@/shared/lib/isEmpty';

type MetaItemValue = ReactNode | ReactNode[];

type Props<T extends MetaItemValue = MetaItemValue> = {
  title: string;
  value: T | null;
  description?: string[];
};

function MangaMetaItem<T extends MetaItemValue = MetaItemValue>({
  title,
  value: rawValue,
}: Props<T>) {
  const value = useMemo(() => {
    if (Array.isArray(rawValue)) {
      return rawValue.length ? (
        <Group gap={4}>
          {rawValue.map((v, index) => (
            <>
              {index > 0 && <MidDot />}
              {v}
            </>
          ))}
        </Group>
      ) : null;
    }

    return rawValue;
  }, [rawValue]);

  return (
    <Stack gap={8}>
      <Text c="dimmed" lh={1} fz={12}>
        {title.toUpperCase()}
      </Text>
      <Text lh={1} fz={16}>
        {isEmpty(value) ? <Mdash /> : value}
      </Text>
    </Stack>
  );
}

export default MangaMetaItem;
