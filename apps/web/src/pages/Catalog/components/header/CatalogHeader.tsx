import { ActionIcon, Alert, Group } from '@mantine/core';
import { CaretLeftIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import type { Dispatch, SetStateAction } from 'react';
import useSource from '@/entities/source/hooks/useSource';
import CatalogHeaderSkeleton from './CatalogHeaderSkeleton';
import SourceTitle from '@/entities/source/components/SourceTitle';
import SearchInput from '@/shared/ui/SearcInput';

type Props = {
  sourceId: string | undefined;
  handleSearch: Dispatch<SetStateAction<string>>;
};

function CatalogHeader({ sourceId, handleSearch }: Props) {
  const navigate = useNavigate();

  const { data: source, isLoading } = useSource({ sourceId });

  if (isLoading) {
    return <CatalogHeaderSkeleton />;
  }

  if (!source) {
    return <Alert title="Источник не найден" color="red" icon={<WarningCircleIcon />} />;
  }

  return (
    <>
      <Group justify="space-between">
        <Group gap="xs">
          <ActionIcon variant="subtle" color="gray" onClick={() => navigate(-1)}>
            <CaretLeftIcon />
          </ActionIcon>
          <SourceTitle source={source} showStatus />
        </Group>
        <SearchInput
          allowClear
          handleSearch={handleSearch}
          placeholder={`Искать в ${source.title}`}
          debounceMs={400}
          w={300}
        />
      </Group>
    </>
  );
}

export default CatalogHeader;
