import { Group } from '@mantine/core';
import useSource from '@/entities/source/hooks/useSource';
import SourceIcon from '@/entities/source/SourceIcon';

type Props = {
  sourceId: string | undefined;
};

function CatalogHeader({ sourceId }: Props) {
  const { data: source, isLoading } = useSource({ sourceId });
  console.log(source);

  if (isLoading) {
    return null;
  }

  if (!source) {
    return null;
  }

  return (
    <Group>
      <Group>
        <SourceIcon id={source.id} title={source.title} />
      </Group>
    </Group>
  );
}

export default CatalogHeader;
