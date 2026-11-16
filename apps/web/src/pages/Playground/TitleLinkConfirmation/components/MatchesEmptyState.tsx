import { EmptyState } from '@mantine/core';
import { EmptyIcon } from '@phosphor-icons/react';

function MatchesEmptyState() {
  return (
    <EmptyState
      title="Похожие тайтлы не найдены"
      description="Алгоритм не нашёл похожих тайтлов на других источниках."
      size="sm"
      icon={<EmptyIcon />}
    />
  );
}

export default MatchesEmptyState;
