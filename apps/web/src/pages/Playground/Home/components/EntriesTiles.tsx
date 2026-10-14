import { useContext } from 'react';
import { SimpleGrid, Stack, Title } from '@mantine/core';
import { PHONE_FRAME_CONTEXT } from '../../Bookmarks/models';
import SelectionsLogosTile from './SelectionsLogosTile';
import SelectionsTile from './SelectionsTile';
import SourceEntryGrid from './SourceEntryGrid';
import SourcesTile from './SourcesTile';

type Props = {
  /** V2, V2c — под плитками сетка карточек источников P4a. */
  withCards?: boolean;
  /** V2b — плитка подборок с логотипами источников вместо веера. */
  withLogos?: boolean;
  /** V2c — плитки «Подборки» нет, её место занимают карточки; «Источники» — во всю ширину. */
  withoutSelectionsTile?: boolean;
};

/** V2 и подварианты — плитки «Подборки» и «Источники» сразу под «Продолжить»: у каждой своя
 *  иконка и картинка. */
function EntriesTiles({
  withCards = false,
  withLogos = false,
  withoutSelectionsTile = false,
}: Props) {
  const isPhone = useContext(PHONE_FRAME_CONTEXT);

  return (
    <Stack gap="xl">
      <SimpleGrid cols={isPhone || withoutSelectionsTile ? 1 : 2} spacing="md">
        {!withoutSelectionsTile && (withLogos ? <SelectionsLogosTile /> : <SelectionsTile />)}
        <SourcesTile />
      </SimpleGrid>
      {withCards && (
        <Stack gap="md">
          <Title order={4}>Подборки источников</Title>
          <SourceEntryGrid />
        </Stack>
      )}
    </Stack>
  );
}

export default EntriesTiles;
