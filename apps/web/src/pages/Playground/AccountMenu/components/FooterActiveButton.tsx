import type { ReactNode } from 'react';
import { Button, Text } from '@mantine/core';

type Props = {
  icon: ReactNode;
  title: string;
};

/** Активная кнопка нижней панели: растянута и подписана. */
function FooterActiveButton({ icon, title }: Props) {
  return (
    <Button flex={4} miw={0} px="xs" variant="light" leftSection={icon}>
      <Text inherit truncate>
        {title}
      </Text>
    </Button>
  );
}

export default FooterActiveButton;
