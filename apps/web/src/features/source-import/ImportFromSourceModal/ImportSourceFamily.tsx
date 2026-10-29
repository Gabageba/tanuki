import { useTranslation } from 'react-i18next';
import type { Source, SourceAccount } from '@tanuki/contracts';
import GroupedList from '@/shared/ui/GroupedList';
import {
  getSourceAccountStatusColor,
  getSourceAccountStatusLabel,
} from '@/entities/source-account/lib';
import SourceAccountStatusIcon from '@/entities/source-account/SourceAccountStatusIcon';
import ImportSourceRow from './ImportSourceRow';
import { isImportableSource } from './lib';

type Props = {
  title: string;
  sources: Source[];
  account: SourceAccount | undefined;
  sourceId: string | null;
};

/**
 * Сеть в выборе «откуда импортировать»: только источники с входом и поддержкой импорта.
 * Сеть без доступных источников скрыта целиком.
 */
function ImportSourceFamily({ title, sources, account, sourceId }: Props) {
  const { t } = useTranslation();
  const importableSources = sources.filter(isImportableSource);

  if (importableSources.length === 0) return null;

  return (
    <GroupedList label={title}>
      <GroupedList.Header
        color={getSourceAccountStatusColor(account)}
        icon={<SourceAccountStatusIcon account={account} />}
        title={getSourceAccountStatusLabel(account, t)}
        description={account?.login}
      />
      {importableSources.map((source) => (
        <ImportSourceRow key={source.id} source={source} isSelected={source.id === sourceId} />
      ))}
    </GroupedList>
  );
}

export default ImportSourceFamily;
