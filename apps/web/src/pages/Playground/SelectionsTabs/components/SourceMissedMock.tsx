import { EmptyState } from '@mantine/core';
import { WarningCircleIcon } from '@phosphor-icons/react';
import type { Source } from '@tanuki/contracts';

type Props = {
  source: Source;
};

/** Источник лежит — как `SourceMissedState` сейчас; вкладок блоков над ним нет: переключать
 *  нечего, ни один блок не придёт. */
function SourceMissedMock({ source }: Props) {
  return (
    <EmptyState
      icon={<WarningCircleIcon />}
      title={`${source.title}: недоступен`}
      description="Подборки этого источника сейчас не получить — попробуйте позже или выберите другой."
    />
  );
}

export default SourceMissedMock;
