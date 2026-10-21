import useReaderSettings from '@/entities/reader/hooks/useReaderSettings';
import QueryBlock from '@/shared/ui/QueryBlock';
import SettingsReaderForm from './SettingsReaderForm';
import SettingsReaderSkeleton from './SettingsReaderSkeleton';

function SettingsReader() {
  const settingsQuery = useReaderSettings();

  return (
    <QueryBlock query={settingsQuery} skeleton={<SettingsReaderSkeleton />}>
      {(settings) => <SettingsReaderForm settings={settings} />}
    </QueryBlock>
  );
}

export default SettingsReader;
