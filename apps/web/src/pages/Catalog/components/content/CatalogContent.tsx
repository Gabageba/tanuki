import PageLayout from '@/shared/ui/PageLayout';
import CatalogSettings from './CatalogSettings';
import CatalogContentGrid from './grid/CatalogContentGrid';

type Props = {
  sourceId: string | undefined;
};

function CatalogContent({ sourceId }: Props) {
  return (
    <PageLayout.Content>
      <CatalogSettings sourceId={sourceId} />
      <CatalogContentGrid sourceId={sourceId} />
    </PageLayout.Content>
  );
}

export default CatalogContent;
