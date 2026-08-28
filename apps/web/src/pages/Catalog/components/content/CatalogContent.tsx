import PageLayout from '@/shared/ui/PageLayout';
import CatalogSettings from './CatalogSettings';
import CatalogContentGrid from './CatalogContentGrid';

type Props = {
  sourceId: string | undefined;
};

function CatalogContent({ sourceId }: Props) {
  return (
    <PageLayout.Content showLoading={false}>
      <CatalogSettings sourceId={sourceId} />
      <CatalogContentGrid />
    </PageLayout.Content>
  );
}

export default CatalogContent;
