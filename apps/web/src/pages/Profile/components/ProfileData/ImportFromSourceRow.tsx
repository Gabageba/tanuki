import { useDisclosure, useNetwork } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { CloudArrowDownIcon } from '@phosphor-icons/react';
import ImportFromSourceModal from '@/features/source-import/ImportFromSourceModal';
import GroupedList from '@/shared/ui/GroupedList';

/** Строка «Импорт из источника» и её модалка. */
function ImportFromSourceRow() {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  // Закладки с сайта читает и пишет сервер — без сети кнопка выключена, как у копии.
  const { online } = useNetwork();

  return (
    <>
      <GroupedList.Row
        icon={<CloudArrowDownIcon />}
        title={t('importFromSource')}
        description={t('bookmarksFromYourSourceAccount')}
        actionProps={{
          leftSection: <CloudArrowDownIcon />,
          onClick: open,
          disabled: !online,
          children: t('import'),
        }}
      />
      <ImportFromSourceModal opened={opened} onClose={close} />
    </>
  );
}

export default ImportFromSourceRow;
