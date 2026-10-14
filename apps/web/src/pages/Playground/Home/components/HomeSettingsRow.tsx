import type { ReactNode } from 'react';
import { Text } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import GroupedList from '@/shared/ui/GroupedList';

type Props = {
  source: Source;
  /** Под названием — по умолчанию домен, как во вкладке «Источники». */
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
};

/** Строка источника во вкладке «Главная»: логотип, название и домен — как во вкладке «Источники»,
 *  только без ручки перетаскивания: порядок меняют там. */
function HomeSettingsRow({ source, description, action, children }: Props) {
  return (
    <GroupedList.Row
      icon={<SourceIcon id={source.id} title={source.title} size={32} />}
      title={
        <Text fz={14} lh="tight" truncate>
          {source.title}
        </Text>
      }
      description={
        description ?? (
          <Text fz={12} lh="tight" c="dimmed" ff="monospace" truncate>
            {source.domain}
          </Text>
        )
      }
      action={action}
    >
      {children}
    </GroupedList.Row>
  );
}

export default HomeSettingsRow;
