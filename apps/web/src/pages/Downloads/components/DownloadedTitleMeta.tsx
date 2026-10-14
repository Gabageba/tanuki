import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { formatSize } from '@/shared/lib/formatSize';
import MidDotGroup from '@/shared/ui/MidDotGroup';

type Props = {
  sourceName: string | undefined;
  count: number;
  bytes: number;
};

/** «Mangalib · 5 гл. · 131 МБ»: источник словом, счётчик и объём — моноширинным. Источник неизвестен
 *  (список источников не загрузился) — его пункта нет. */
function DownloadedTitleMeta({ sourceName, count, bytes }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <MidDotGroup
      truncate
      text={{ fz: 'xs', c: 'dimmed' }}
      separatorProps={{ c: 'dimmed', fz: 'xs' }}
      items={[
        sourceName,
        <Text key="count" span inherit ff="monospace">
          {t('countChaptersAbbrev', { count })}
        </Text>,
        <Text key="size" span inherit ff="monospace">
          {formatSize(bytes, t, i18n.language)}
        </Text>,
      ]}
    />
  );
}

export default DownloadedTitleMeta;
