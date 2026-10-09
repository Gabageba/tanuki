import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import CollapsibleGroup from '@/shared/ui/CollapsibleGroup';
import type { FoundGroup } from '../models';
import FoundOnChip from './FoundOnChip';

type Props = {
  found: FoundGroup[];
};

/** «Найдено на:» и чипы источников, где что-то нашлось. */
function FoundOnRow({ found }: Props) {
  const { t } = useTranslation();

  if (found.length === 0) {
    return null;
  }

  return (
    <CollapsibleGroup gap="xs">
      <Text c="dimmed" fz="sm">
        {t('foundOn')}
      </Text>
      {found.map((group) => (
        <FoundOnChip key={group.source.id} group={group} />
      ))}
    </CollapsibleGroup>
  );
}

export default FoundOnRow;
