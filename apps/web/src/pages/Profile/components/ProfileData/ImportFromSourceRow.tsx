import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { CloudArrowDownIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import ImportFromSourceModal from './ImportFromSourceModal';

/** Строка «Импорт из источника» и её модалка. */
function ImportFromSourceRow() {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <GroupedList.Row
        icon={<CloudArrowDownIcon />}
        title={t('importFromSource')}
        description={t('bookmarksFromYourSourceAccount')}
        actionProps={{
          leftSection: <CloudArrowDownIcon />,
          onClick: open,
          children: t('import'),
        }}
      />
      <ImportFromSourceModal opened={opened} onClose={close} />
    </>
  );
}

export default ImportFromSourceRow;
