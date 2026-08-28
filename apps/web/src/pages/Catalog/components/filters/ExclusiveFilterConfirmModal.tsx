import { Button, Checkbox, Group, Modal, Text } from '@mantine/core';
import { useState } from 'react';

type Props = {
  opened: boolean;
  groupTitle: string | undefined;
  onConfirm: (rememberChoice: boolean) => void;
  onCancel: () => void;
};

function ExclusiveFilterConfirmModal({ opened, groupTitle, onConfirm, onCancel }: Props) {
  const [rememberChoice, setRememberChoice] = useState(false);

  return (
    <Modal opened={opened} onClose={onCancel} title="Сбросить другие фильтры?" centered>
      <Text size="sm" mb="md">
        Источник не умеет сочетать эти фильтры между собой — выбор
        {groupTitle ? ` «${groupTitle}»` : ' этого варианта'} сбросит остальные.
      </Text>
      <Checkbox
        label="Больше не спрашивать"
        checked={rememberChoice}
        onChange={(event) => setRememberChoice(event.currentTarget.checked)}
        mb="md"
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Отмена
        </Button>
        <Button onClick={() => onConfirm(rememberChoice)}>Заменить</Button>
      </Group>
    </Modal>
  );
}

export default ExclusiveFilterConfirmModal;
