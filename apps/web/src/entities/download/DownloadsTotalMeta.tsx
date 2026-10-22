import { useTranslation } from 'react-i18next';
import { formatSize } from '@/shared/lib/formatSize';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import useDownloadsTotal from './hooks/useDownloadsTotal';

/** «42 гл. · 1,8 ГБ» моноширинным — сколько скачано на этом устройстве; ничего — словами. Размер и
 *  цвет — от строки, в которой стоит. */
function DownloadsTotalMeta() {
  const { t, i18n } = useTranslation();
  const total = useDownloadsTotal();

  if (!total) return null;
  if (total.count === 0) return t('nothingDownloaded');

  return (
    <MidDotGroup
      text={{ inherit: true, ff: 'monospace' }}
      items={[
        t('countChaptersAbbrev', { count: total.count }),
        formatSize(total.bytes, t, i18n.language),
      ]}
    />
  );
}

export default DownloadsTotalMeta;
