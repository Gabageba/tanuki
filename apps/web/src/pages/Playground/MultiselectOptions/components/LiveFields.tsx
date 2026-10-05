import { useState } from 'react';
import { Group, Select } from '@mantine/core';
import { BooksIcon, MaskHappyIcon, BookOpenIcon } from '@phosphor-icons/react';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import { getOptionClassName, getOptionsClassName } from '../lib';
import { LIVE_CONTENT_TYPES, LIVE_GENRES } from '../mocks';
import type { OptionFocus, OptionLook } from '../models';

type Props = {
  look: OptionLook;
  focus: OptionFocus;
};

/** Настоящие поля с видом варианта — проверить мышью и стрелками. */
function LiveFields({ look, focus }: Props) {
  const [contentTypes, setContentTypes] = useState(['mangaAndManhwa', 'hentai', 'comics']);
  const [genres, setGenres] = useState(['comedy', 'drama', 'romance', 'horror']);
  const [single, setSingle] = useState<string | null>('comics');
  const classNames = {
    option: getOptionClassName(look, focus),
    options: getOptionsClassName(look),
  };

  return (
    <Group gap="xs" align="flex-start">
      <CompactMultiSelect
        w={260}
        data={LIVE_CONTENT_TYPES}
        value={contentTypes}
        placeholder={contentTypes.length ? undefined : 'Весь контент'}
        clearable
        leftSection={<BooksIcon />}
        classNames={classNames}
        onChange={setContentTypes}
      />
      <CompactMultiSelect
        w={240}
        data={LIVE_GENRES}
        value={genres}
        placeholder={genres.length ? undefined : 'Все жанры'}
        clearable
        leftSection={<MaskHappyIcon />}
        classNames={classNames}
        onChange={setGenres}
      />
      <Select
        w={220}
        data={LIVE_CONTENT_TYPES}
        value={single}
        aria-label="Тип контента"
        leftSection={<BookOpenIcon />}
        allowDeselect={false}
        classNames={classNames}
        onChange={setSingle}
      />
    </Group>
  );
}

export default LiveFields;
