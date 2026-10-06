import { Stack, TextInput } from '@mantine/core';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { SOURCE_ID } from '@tanuki/contracts';
import PhoneFrame from './PhoneFrame';
import SourceRowMock from './SourceRowMock';
import { ADMIN } from '../mocks';
import { MENU_TRIGGER, type SheetHeight, type SheetPosition } from '../models';

type Props = {
  position: SheetPosition;
  height?: SheetHeight;
};

/** Выбор источника на телефоне — самый длинный список, на нём видна разница сторон. */
function SourcesPhone({ position, height }: Props) {
  return (
    <PhoneFrame
      user={ADMIN}
      trigger={MENU_TRIGGER.SOURCES}
      position={position}
      height={height}
      title="Источники"
    >
      <Stack gap={4}>
        <TextInput leftSection={<MagnifyingGlassIcon />} placeholder="Найти источник" mb="xs" />
        <SourceRowMock id={SOURCE_ID.MANGALIB} title="MangaLib" domain="mangalib.me" />
        <SourceRowMock id={SOURCE_ID.REMANGA} title="Remanga" domain="remanga.org" />
        <SourceRowMock id={SOURCE_ID.MINTMANGA} title="MintManga" domain="mintmanga.one" />
        <SourceRowMock id={SOURCE_ID.READMANGA_RU} title="ReadManga" domain="readmanga.io" />
        <SourceRowMock id={SOURCE_ID.SENKURO} title="Senkuro" domain="senkuro.com" />
        <SourceRowMock id={SOURCE_ID.USAGI} title="Usagi" domain="usagi.one" />
        <SourceRowMock id={SOURCE_ID.DESUME} title="Desu" domain="desu.city" />
        <SourceRowMock id={SOURCE_ID.ACOMICS} title="AComics" domain="acomics.ru" />
      </Stack>
    </PhoneFrame>
  );
}

export default SourcesPhone;
