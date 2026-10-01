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

function TitleMetaItem<T extends MetaItemValue = MetaItemValue>({
  label,
  value: rawValue,
}: Props<T>) {
  const value = useMemo(() => {
    if (Array.isArray(rawValue)) {
      if (rawValue.length === 0) {
        return <Mdash />;
      }

      return <MidDotGroup items={rawValue.filter(Boolean)} text={{ lh: 'tight' }} lh="tight" />;
    }

    return isEmpty(rawValue) ? <Mdash /> : rawValue;
  }, [rawValue]);

  return (
    <Stack gap={8}>
      <Text lh="tight" c="dimmed" fz={11} tt="uppercase" lts={1}>
        {label}
      </Text>
      <Text component="div" lh="tight">
        {isEmpty(value) ? <Mdash /> : value}
      </Text>
    </Stack>
  );
}

export default TitleMetaItem;
