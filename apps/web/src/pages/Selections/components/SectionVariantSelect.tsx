import { Select } from '@mantine/core';
import { FunnelIcon } from '@phosphor-icons/react';
import type { HomeSectionInfo } from '@tanuki/contracts';

type Props = {
  section: HomeSectionInfo;
  value: string;
  onChange: (variant: string) => void;
};

/**
 * Переключатель внутри блока (P2) — период, страна, как у сайта; подписи приходят с сервера.
 * У блока без вариантов ничего не рисует. На телефоне поле тянется на всю ширину строки.
 */
function SectionVariantSelect({ section, value, onChange }: Props) {
  if (section.variants.length === 0) return null;

  return (
    <Select
      aria-label={section.title}
      data={section.variants.map(({ id, title }) => ({ value: id, label: title }))}
      value={value}
      onChange={(next) => {
        if (next) onChange(next);
      }}
      allowDeselect={false}
      leftSection={<FunnelIcon />}
      w={{ base: '100%', xs: 160 }}
    />
  );
}

export default SectionVariantSelect;
