import useSources from '@/entities/source/hooks/useSources';
import QueryBlock from '@/shared/ui/QueryBlock';
import SettingsSourcesList from './SettingsSourcesList';
import SettingsSourcesSkeleton from './SettingsSourcesSkeleton';

function SettingsSources() {
  const sourcesQuery = useSources();

  return (
    <QueryBlock query={sourcesQuery} skeleton={<SettingsSourcesSkeleton />}>
      {(data) => <SettingsSourcesList data={data} />}
    </QueryBlock>
  );
}

export default SettingsSources;
