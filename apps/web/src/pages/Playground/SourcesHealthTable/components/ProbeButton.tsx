import { Button } from '@mantine/core';
import { StethoscopeIcon } from '@phosphor-icons/react';
import useSimulatedProbe from '../hooks/useSimulatedProbe';

type Props = {
  label: string;
};

/** «Проверить все» в шапке и «Проверить сейчас» в карточке — только у персонала. */
function ProbeButton({ label }: Props) {
  const { isPending, run } = useSimulatedProbe();

  return (
    <Button
      variant="default"
      leftSection={<StethoscopeIcon size={16} />}
      loading={isPending}
      onClick={run}
    >
      {label}
    </Button>
  );
}

export default ProbeButton;
