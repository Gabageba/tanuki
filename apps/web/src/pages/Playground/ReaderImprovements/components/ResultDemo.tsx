import { useState } from 'react';
import { SimpleGrid, Stack, Text } from '@mantine/core';
import {
  READER_CHAPTER_GAP,
  READER_CONTAINER_WIDTH,
  READER_PAGE_GAP,
  READER_TAP_ZONE_WIDTH,
} from '@tanuki/contracts';
import { SETTINGS_LAYOUT } from '../models';
import { RESULT_CONTEXT } from '../resultContext';
import ResultReader from './ResultReader';
import SettingsMock from './SettingsMock';

function ResultDemo() {
  const mode = useState('pages');
  const direction = useState('ltr');
  const pages = useState('spread');
  const background = useState('black');
  const fit = useState('height');
  const brightness = useState(100);
  const prefetch = useState(3);
  const wake = useState(false);
  const width = useState<number>(READER_CONTAINER_WIDTH.MEDIUM);
  const tap = useState<number>(READER_TAP_ZONE_WIDTH.MEDIUM);
  const pageGap = useState<number>(READER_PAGE_GAP.NARROW);
  const chapterGap = useState<number>(READER_CHAPTER_GAP.MEDIUM);
  const autoNext = useState(true);
  const hidePanels = useState(true);
  return (
    <RESULT_CONTEXT.Provider
      value={{
        mode,
        direction,
        pages,
        background,
        fit,
        brightness,
        prefetch,
        wake,
        width,
        tap,
        pageGap,
        chapterGap,
        autoNext,
        hidePanels,
      }}
    >
      <Stack gap="lg">
        <Text fz="sm" c="dimmed">
          Компьютер
        </Text>
        <ResultReader />
        <Text fz="sm" c="dimmed">
          Телефон · до 375 px
        </Text>
        <Stack maw={375}>
          <ResultReader mobile />
        </Stack>
        <Text fz="sm" c="dimmed">
          Вкладка настроек приложения
        </Text>
        <SimpleGrid cols={1}>
          <SettingsMock layout={SETTINGS_LAYOUT.GROUP} initialFitWhole />
        </SimpleGrid>
      </Stack>
    </RESULT_CONTEXT.Provider>
  );
}
export default ResultDemo;
