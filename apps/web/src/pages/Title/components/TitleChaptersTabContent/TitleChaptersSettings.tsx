import { Button, Group } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SortAscendingIcon, SortDescendingIcon } from '@phosphor-icons/react';
import { SORT_DIRECTION, SortDirectionSchema, type SortDirection } from '@tanuki/contracts';

function TitleChaptersSettings() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const parsedDirection = SortDirectionSchema.safeParse(searchParams.get('direction'));
  const direction = parsedDirection.success ? parsedDirection.data : SORT_DIRECTION.DESC;

  const handleDirectionToggle = () => {
    const nextDirection: SortDirection =
      direction === SORT_DIRECTION.DESC ? SORT_DIRECTION.ASC : SORT_DIRECTION.DESC;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('direction', nextDirection);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <Group gap="sm">
      <Button
        variant="default"
        leftSection={
          direction === SORT_DIRECTION.DESC ? <SortDescendingIcon /> : <SortAscendingIcon />
        }
        onClick={handleDirectionToggle}
      >
        {direction === SORT_DIRECTION.DESC ? t('newestFirst') : t('oldestFirst')}
      </Button>
    </Group>
  );
}

export default TitleChaptersSettings;
