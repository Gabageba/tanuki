import { Avatar, Box, Flex, Stack, Text, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { APPROXIMATE_STYLE, type ApproximateStyle, type SourceStackItem } from '../models';
import { hasQuestionBadge, isApproximate, isDimmedApproximate } from '../lib';
import styles from '../ReadingMarks.module.scss';

type Props = {
  items: SourceStackItem[];
  /** undefined — примерное место иконка не показывает: его рисует сам макет (диапазон в A4). */
  approximateStyle: ApproximateStyle | undefined;
  size: number;
  max?: number;
  /** Иконки друг под другом, вдоль линии, — макет A2c. */
  vertical?: boolean;
};

/**
 * Перекрывающиеся иконки источников; не влезшие — «+N». Своя раскладка вместо Avatar.Group:
 * бейдж «?» в углу иконки ломал бы отрицательные отступы группы.
 */
function SourceStack({
  items,
  approximateStyle,
  size,
  max = items.length,
  vertical = false,
}: Props) {
  const { t } = useTranslation();
  const visible = items.length > max ? items.slice(0, max - 1) : items;
  const hiddenCount = items.length - visible.length;
  const overlap = size / 3;
  const getOffset = (index: number) =>
    vertical ? { mt: index === 0 ? 0 : -overlap } : { ml: index === 0 ? 0 : -overlap };
  const withCaption =
    approximateStyle === APPROXIMATE_STYLE.CAPTION &&
    items.some((item) => isApproximate(item.confidence));

  const getTooltip = (item: SourceStackItem) => {
    if (!item.confidence) return `${item.source.title}: места в этой ветке не нашлось`;
    return isApproximate(item.confidence)
      ? `${item.source.title}: ${t('placeIsApproximate').toLowerCase()}`
      : item.source.title;
  };

  const getClassName = (item: SourceStackItem) => {
    if (!item.confidence) return styles.unplaced;
    return approximateStyle && isDimmedApproximate(approximateStyle, item.confidence)
      ? styles.approximate
      : undefined;
  };

  return (
    <Stack gap={0} align="center">
      <Flex direction={vertical ? 'column' : 'row'} wrap="nowrap">
        {visible.map((item, index) => (
          <Tooltip key={item.source.id} label={getTooltip(item)} withinPortal>
            <Box pos="relative" {...getOffset(index)} className={styles.stackItem}>
              <SourceIcon
                id={item.source.id}
                title={item.source.title}
                size={size}
                className={getClassName(item)}
              />
              {approximateStyle && hasQuestionBadge(approximateStyle, item.confidence) && (
                <span className={styles.questionBadge}>?</span>
              )}
            </Box>
          </Tooltip>
        ))}
        {hiddenCount > 0 && (
          <Box {...getOffset(visible.length)} className={styles.stackItem}>
            <Avatar size={size}>
              <Text span fz={size / 2.4} ff="monospace">
                +{hiddenCount}
              </Text>
            </Avatar>
          </Box>
        )}
      </Flex>
      {withCaption && (
        <Text fz={10} lh={1.2} c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          ≈{' '}
          <Text span inherit visibleFrom="xs">
            примерно
          </Text>
        </Text>
      )}
    </Stack>
  );
}

export default SourceStack;
