import { Text } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { formatSize } from '@/shared/lib/formatSize';

type Props = {
  count: number;
  neededBytes: number;
  /** null — браузер не говорит, сколько свободно. */
  freeBytes: number | null;
};

const MONO = { mono: <Text span inherit ff="monospace" /> };

/** Фраза целиком одним ключом: без «Свободно», когда браузер его не знает, и с предупреждением,
 *  когда места может не хватить. */
const getSummaryKey = (freeBytes: number | null, isTight: boolean) => {
  if (freeBytes === null) return 'willDownloadChaptersAboutSize';
  return isTight ? 'willDownloadChaptersAboutSizeMayNotFit' : 'willDownloadChaptersAboutSizeFree';
};

/** Сколько встанет в очередь, примерно сколько это места и сколько свободно. Не хватает — строка
 *  золотая, но скачать можно: очередь встанет на паузу, когда место кончится. */
function DownloadSummary({ count, neededBytes, freeBytes }: Props) {
  const { t, i18n } = useTranslation();
  const isTight = freeBytes !== null && neededBytes > freeBytes;

  return (
    <Text fz="sm" c={isTight ? STATUS_DEGRADED_COLOR : undefined}>
      <Trans
        t={t}
        i18nKey={getSummaryKey(freeBytes, isTight)}
        values={{
          count,
          size: formatSize(neededBytes, t, i18n.language),
          free: freeBytes === null ? '' : formatSize(freeBytes, t, i18n.language),
        }}
        components={MONO}
      />
    </Text>
  );
}

export default DownloadSummary;
