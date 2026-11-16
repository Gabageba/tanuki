import { Box, Checkbox, UnstyledButton } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TitleMatch } from '@tanuki/contracts';
import SourceTitleCard from '@/entities/source/components/SourceTitleCard/SourceTitleCard';
import styles from './TitleMatchCard.module.scss';

type Props = {
  match: TitleMatch;
  isChecking: boolean;
  selected: boolean;
  disabled: boolean;
  onToggle: (targetId: string) => void;
};

function TitleMatchCard({ match, isChecking, selected, disabled, onToggle }: Props) {
  const { t } = useTranslation();

  return (
    <Box
      w={170}
      pos="relative"
      className={styles.card}
      data-checking={isChecking || undefined}
      data-selected={selected || undefined}
    >
      <SourceTitleCard title={match.title} showSource />
      {isChecking && (
        <UnstyledButton
          pos="absolute"
          inset={0}
          w="100%"
          h="100%"
          className={styles.trigger}
          role="checkbox"
          aria-checked={selected}
          aria-label={t('selectCandidate', { name: match.title.name })}
          disabled={disabled}
          onClick={() => onToggle(match.title.id)}
        >
          <Box pos="absolute" top={8} right={8}>
            <Checkbox.Indicator checked={selected} disabled={disabled} size="md" aria-hidden />
          </Box>
        </UnstyledButton>
      )}
    </Box>
  );
}

export default TitleMatchCard;
