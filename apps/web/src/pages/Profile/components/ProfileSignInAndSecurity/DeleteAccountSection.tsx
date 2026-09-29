import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { TrashIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import DeleteAccountModal from './DeleteAccountModal';

function DeleteAccountSection() {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <GroupedList label={t('dangerZone')} color="red">
        <GroupedList.Row
          title={t('deleteAccount')}
          description={t('deletionIn14DaysCanBeCancelled')}
          icon={<TrashIcon fill="var(--mantine-color-red-filled)" />}
          actionProps={{
            color: 'red',
            variant: 'muted',
            leftSection: <TrashIcon />,
            onClick: open,
            children: t('delete'),
          }}
        />
      </GroupedList>
      <DeleteAccountModal opened={opened} onClose={close} />
    </>
  );
}

export default DeleteAccountSection;
