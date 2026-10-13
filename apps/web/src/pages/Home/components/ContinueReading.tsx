import { Box, Group, Scroller } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import useContinueReading from '../hooks/useContinueReading';
import useHideFromContinueReading from '../hooks/useHideFromContinueReading';
import ContinueReadingCard from './ContinueReadingCard';
import ContinueReadingSkeleton from './ContinueReadingSkeleton';
import HomeBlock from './HomeBlock';

/** «Продолжить чтение» — лента карточек C1a; ничего не читали или всё убрали — блока нет. */
function ContinueReading() {
  const { t } = useTranslation();
  const { data, isPending } = useContinueReading();
  const hide = useHideFromContinueReading();

  if (isPending) {
    return <ContinueReadingSkeleton />;
  }

  if (!data?.items.length) {
    return null;
  }

  return (
    <HomeBlock title={t('continueReading')}>
      <Scroller>
        <Group gap="md" wrap="nowrap" align="flex-start">
          {data.items.map((item) => (
            <Box key={item.title.id} w={{ base: 128, sm: 168 }} flex="none">
              <ContinueReadingCard item={item} onRemove={() => hide.mutate(item.title.id)} />
            </Box>
          ))}
        </Group>
      </Scroller>
    </HomeBlock>
  );
}

export default ContinueReading;
