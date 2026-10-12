import { useState } from 'react';
import { Stack } from '@mantine/core';
import {
  CATALOG_LINK,
  SHORT_BLOCKS,
  type HomeSource,
  type SourcePicker as SourcePickerKind,
} from '../models';
import HomeBlocksStack from './HomeBlocksStack';
import HomeSourceHeader from './HomeSourceHeader';
import SourcePicker from './SourcePicker';

type Props = {
  homes: HomeSource[];
  picker: SourcePickerKind;
  /** С какого источника открыть — например, с того, чью карточку нажали на главной. */
  initialId?: string;
};

/** Подборки одного источника за раз: выбор источника, под ним его заголовок и все его блоки
 *  лентами — источник один, вкладки блоков не нужны. В приложении открыт последний выбранный; в
 *  макете — первый. */
function OneSourceSelections({ homes, picker, initialId }: Props) {
  const [activeId, setActiveId] = useState(initialId ?? homes[0]?.source.id ?? '');
  const active = homes.find((home) => home.source.id === activeId) ?? homes[0];

  if (!active) {
    return null;
  }

  return (
    <Stack gap="lg">
      <SourcePicker
        kind={picker}
        sources={homes.map(({ source }) => source)}
        activeId={active.source.id}
        onChange={setActiveId}
      />
      <Stack gap="md">
        <HomeSourceHeader source={active.source} link={CATALOG_LINK.RIGHT} />
        <HomeBlocksStack blocks={active.blocks} shortBlocks={SHORT_BLOCKS.RIBBON} />
      </Stack>
    </Stack>
  );
}

export default OneSourceSelections;
