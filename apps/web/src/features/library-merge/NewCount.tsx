import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import Mdash from '@/shared/ui/Mdash';

type Props = {
  value: number;
  /** Число глав — «+1204 гл.». */
  isChapters?: boolean;
};

/** Сколько нового — справа в строке, моноширинным; ноль — тире. */
function NewCount({ value, isChapters = false }: Props) {
  const { t } = useTranslation();

  if (value === 0) {
    return <Mdash c="dimmed" fz="sm" />;
  }

  return (
    <Text lh="tight" ff="monospace" fz="sm" style={{ whiteSpace: 'nowrap' }}>
      {isChapters
        ? t('plusCountChaptersAbbrev', { count: value })
        : t('plusCount', { count: value })}
    </Text>
  );
}

export default NewCount;
