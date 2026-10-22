import type { Title } from '@tanuki/contracts';
import useSource from '@/entities/source/hooks/useSource';
import QueryBlock from '@/shared/ui/QueryBlock';
import TitleBreadcrumbsContent from './TitleBreadcrumbsContent';
import TitleBreadcrumbsSkeleton from './TitleBreadcrumbsSkeleton';

type Props = {
  title: Title;
};

function TitleBreadcrumbs({ title }: Props) {
  const sourceQuery = useSource({ sourceId: title.sourceId });

  return (
    <QueryBlock query={sourceQuery} skeleton={<TitleBreadcrumbsSkeleton />}>
      {(source) => <TitleBreadcrumbsContent title={title} source={source} />}
    </QueryBlock>
  );
}

export default TitleBreadcrumbs;
