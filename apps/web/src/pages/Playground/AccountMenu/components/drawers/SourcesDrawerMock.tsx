import { Stack, TextInput, ThemeIcon } from '@mantine/core';
import { MagnifyingGlassIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { SOURCE_ID } from '@tanuki/contracts';
import DrawerPanel from '../DrawerPanel';
import DrawerHeading from '../DrawerHeading';
import SourceRowMock from '../SourceRowMock';
import { HEADER_STYLE, type HeaderStyle } from '../../models';

type Props = {
  headerStyle: HeaderStyle;
};

function SourcesDrawerMock({ headerStyle }: Props) {
  return (
    <DrawerPanel
      title={
        headerStyle === HEADER_STYLE.UNIFORM ? (
          <DrawerHeading
            icon={
              <ThemeIcon size={40} radius="md" flex="none">
                <SquaresFourIcon size={20} />
              </ThemeIcon>
            }
            title="Источники"
            subtitle="Сейчас: все источники"
          />
        ) : (
          'Источники'
        )
      }
    >
      <Stack gap={4}>
        <TextInput leftSection={<MagnifyingGlassIcon />} placeholder="Найти источник" mb="xs" />
        <SourceRowMock id={SOURCE_ID.MANGALIB} title="MangaLib" domain="mangalib.me" />
        <SourceRowMock id={SOURCE_ID.REMANGA} title="Remanga" domain="remanga.org" />
        <SourceRowMock id={SOURCE_ID.MINTMANGA} title="MintManga" domain="mintmanga.one" />
      </Stack>
    </DrawerPanel>
  );
}

export default SourcesDrawerMock;
