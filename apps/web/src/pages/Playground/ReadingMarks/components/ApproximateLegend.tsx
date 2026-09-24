import { Avatar, Box, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { APPROXIMATE_STYLE, type ApproximateStyle } from '../models';
import styles from '../ReadingMarks.module.scss';

type Props = {
  approximateStyle: ApproximateStyle;
};

/** Образец значка примерного места в выбранном стиле. */
const renderApproximateSample = (approximateStyle: ApproximateStyle) => {
  switch (approximateStyle) {
    case APPROXIMATE_STYLE.DIMMED:
      return <Avatar size={16} className={styles.approximate} />;
    case APPROXIMATE_STYLE.QUESTION_BADGE:
      return (
        <Box pos="relative" className={styles.stackItem}>
          <Avatar size={16} />
          <span className={styles.questionBadge}>?</span>
        </Box>
      );
    case APPROXIMATE_STYLE.CAPTION:
      return (
        <Text fz={12} c="dimmed">
          ≈ примерно
        </Text>
      );
    case APPROXIMATE_STYLE.RANGE:
      return <span className={styles.legendBracket} />;
  }
};

/** Строка над списком глав: что значит значок примерного места. */
function ApproximateLegend({ approximateStyle }: Props) {
  const { t } = useTranslation();

  return (
    <Group
      gap={8}
      px="md"
      py={6}
      wrap="nowrap"
      style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
    >
      {renderApproximateSample(approximateStyle)}
      <Text fz={12} c="dimmed">
        — {t('placeIsApproximate').toLowerCase()}
      </Text>
    </Group>
  );
}

export default ApproximateLegend;
