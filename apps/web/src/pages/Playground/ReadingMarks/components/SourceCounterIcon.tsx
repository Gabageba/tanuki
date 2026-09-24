import { Box, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import SourceIcon from '@/entities/source/components/SourceIcon';
import type { ApproximateStyle, SourceStackItem } from '../models';
import { hasQuestionBadge, isApproximate, isDimmedApproximate } from '../lib';
import styles from '../ReadingMarks.module.scss';

type Props = {
  items: SourceStackItem[];
  approximateStyle: ApproximateStyle;
  size: number;
};

/**
 * Одна иконка — самый свежий источник — и счётчик «+N» в углу вместо стопки: ширина всегда как
 * у одной иконки, сколько бы источников ни сошлось на главе.
 */
function SourceCounterIcon({ items, approximateStyle, size }: Props) {
  const { t } = useTranslation();
  const [first] = items;
  if (!first) return null;

  const tooltip = items
    .map((item) =>
      isApproximate(item.confidence)
        ? `${item.source.title}: ${t('placeIsApproximate').toLowerCase()}`
        : item.source.title,
    )
    .join(', ');

  return (
    <Tooltip label={tooltip} withinPortal multiline maw={260}>
      <Box pos="relative" flex="none" className={styles.stackItem}>
        <SourceIcon
          id={first.source.id}
          title={first.source.title}
          size={size}
          className={
            isDimmedApproximate(approximateStyle, first.confidence) ? styles.approximate : undefined
          }
        />
        {items.length > 1 && (
          <Box component="span" ff="monospace" className={styles.countBadge}>
            +{items.length - 1}
          </Box>
        )}
        {hasQuestionBadge(approximateStyle, first.confidence) && (
          <span className={styles.questionBadge}>?</span>
        )}
      </Box>
    </Tooltip>
  );
}

export default SourceCounterIcon;
