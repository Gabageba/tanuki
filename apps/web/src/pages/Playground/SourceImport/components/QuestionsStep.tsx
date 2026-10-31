import { useState } from 'react';
import { Button, Radio, Stack, Text } from '@mantine/core';
import { CloudArrowDownIcon } from '@phosphor-icons/react';
import { RESTORE_FOLDER_POLICY, RESTORE_PROGRESS_POLICY } from '@tanuki/contracts';
import ModalButtonsLayout from '@/shared/ui/ModalButtonsLayout';
import RadioCardOption from '@/shared/ui/RadioCardOption';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import ModalFrame from '../../components/ModalFrame';
import { SOURCE_TITLE } from '../models';

type Props = {
  isPhone?: boolean;
};

/** Q1 — вопросы как Q1a копии, только «из копии» стало «из источника». */
function QuestionsStep({ isPhone = false }: Props) {
  const [folderPolicy, setFolderPolicy] = useState<string>(RESTORE_FOLDER_POLICY.KEEP_MINE);
  const [progressPolicy, setProgressPolicy] = useState<string>(RESTORE_PROGRESS_POLICY.FURTHEST);

  return (
    <ModalFrame
      title={`Закладки на ${SOURCE_TITLE}`}
      tone={MODAL_TONE.NEUTRAL}
      icon={CloudArrowDownIcon}
      isPhone={isPhone}
      onBack={() => undefined}
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text lh="tight" fz="sm" fw={500}>
            7 тайтлов уже в закладках, но в другой папке
          </Text>
          <Radio.Group value={folderPolicy} onChange={setFolderPolicy}>
            <Stack gap="xs">
              <RadioCardOption
                value={RESTORE_FOLDER_POLICY.KEEP_MINE}
                title="Оставить мои"
                description="Тайтлы останутся в своих папках"
              />
              <RadioCardOption
                value={RESTORE_FOLDER_POLICY.FROM_BACKUP}
                title="Взять из источника"
                description="Тайтлы переедут в папки, как на сайте"
              />
            </Stack>
          </Radio.Group>
        </Stack>
        <Stack gap="xs">
          <Text lh="tight" fz="sm" fw={500}>
            Где остановился: 5 отметок расходятся с вашими
          </Text>
          <Radio.Group value={progressPolicy} onChange={setProgressPolicy}>
            <Stack gap="xs">
              <RadioCardOption
                value={RESTORE_PROGRESS_POLICY.FURTHEST}
                title="Дальше прочитанное"
                description="Из двух отметок останется та, что дальше по главам"
              />
              <RadioCardOption
                value={RESTORE_PROGRESS_POLICY.KEEP_MINE}
                title="Мой текущий"
                description="Ваши отметки не изменятся"
              />
              <RadioCardOption
                value={RESTORE_PROGRESS_POLICY.FROM_BACKUP}
                title="С источника"
                description="Ваши отметки заменятся отметками с сайта"
              />
            </Stack>
          </Radio.Group>
        </Stack>
        <ModalButtonsLayout>
          <Button variant="default">Отмена</Button>
          <Button leftSection={<CloudArrowDownIcon />}>Импорт</Button>
        </ModalButtonsLayout>
      </Stack>
    </ModalFrame>
  );
}

export default QuestionsStep;
