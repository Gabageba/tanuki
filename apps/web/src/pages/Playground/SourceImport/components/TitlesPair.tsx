import { Group } from '@mantine/core';
import CaptionedFrame from '../../LibraryBackup/components/CaptionedFrame';
import { BASE_CONFIG, type SiteFolder, type TitlesConfig } from '../models';
import TitlesStep from './TitlesStep';

type Props = {
  folders: SiteFolder[];
  /** Что меняет вариант относительно базы L1 + K1 + R2 + A1 + P0 + M1. */
  config: Partial<TitlesConfig>;
};

/** Шаг «Тайтлы» рядом в двух ширинах: десктоп 440 и телефон 375. */
function TitlesPair({ folders, config }: Props) {
  const merged = { ...BASE_CONFIG, ...config };

  return (
    <Group align="flex-start" gap="lg">
      <CaptionedFrame caption="Десктоп · 440 px">
        <TitlesStep folders={folders} config={merged} />
      </CaptionedFrame>
      <CaptionedFrame caption="Телефон · 375 px">
        <TitlesStep folders={folders} config={merged} isPhone />
      </CaptionedFrame>
    </Group>
  );
}

export default TitlesPair;
