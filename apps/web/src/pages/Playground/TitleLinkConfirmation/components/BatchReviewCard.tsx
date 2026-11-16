import { Box, Checkbox, UnstyledButton } from '@mantine/core';
import { MATCHES } from '../mocks';
import TapReviewCard from './TapReviewCard';
import styles from './TapReviewCard.module.scss';

type Props = {
  index: number;
  selected: boolean;
  disabled: boolean;
  onToggle: (index: number) => void;
};

function BatchReviewCard({ index, selected, disabled, onToggle }: Props) {
  return (
    <TapReviewCard index={index} selected={selected}>
      <UnstyledButton
        pos="absolute"
        inset={0}
        w="100%"
        h="100%"
        className={styles.trigger}
        role="checkbox"
        aria-checked={selected}
        aria-label={`Выбрать кандидата «${MATCHES[index]!.title.name}»`}
        disabled={disabled}
        onClick={() => onToggle(index)}
      >
        <Box pos="absolute" top={8} right={8}>
          <Checkbox.Indicator checked={selected} disabled={disabled} size="md" aria-hidden />
        </Box>
      </UnstyledButton>
    </TapReviewCard>
  );
}

export default BatchReviewCard;
