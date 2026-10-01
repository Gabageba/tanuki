import {
  BookOpenIcon,
  BookOpenTextIcon,
  BooksIcon,
  GearIcon,
  PlugsIcon,
} from '@phosphor-icons/react';
import { READER_GROUP, TAB_NAMING, type ReaderGroup, type TabNaming } from './models';

const GENERAL_TABS = [
  { value: 'general', label: 'Общие', icon: <GearIcon /> },
  { value: 'sources', label: 'Источники', icon: <PlugsIcon /> },
];

/** Вкладки настроек при выбранном названии новой: первые две — те, что есть сейчас. */
export const getTabs = (naming: TabNaming) => {
  switch (naming) {
    case TAB_NAMING.READING:
      return [...GENERAL_TABS, { value: 'reading', label: 'Чтение', icon: <BookOpenIcon /> }];
    case TAB_NAMING.LIBRARY_AND_READING:
      return [
        ...GENERAL_TABS,
        { value: 'reading', label: 'Библиотека и чтение', icon: <BookOpenIcon /> },
      ];
    case TAB_NAMING.READER:
      return [...GENERAL_TABS, { value: 'reading', label: 'Читалка', icon: <BookOpenTextIcon /> }];
    case TAB_NAMING.TWO_TABS:
      return [
        ...GENERAL_TABS,
        { value: 'library', label: 'Библиотека', icon: <BooksIcon /> },
        { value: 'reading', label: 'Читалка', icon: <BookOpenTextIcon /> },
      ];
  }
};

export const getReaderGroupLabel = (group: ReaderGroup) => {
  switch (group) {
    case READER_GROUP.READER:
      return 'Читалка';
    case READER_GROUP.DISPLAY:
      return 'Отображение';
    case READER_GROUP.SPACING:
      return 'Отступы и зона клика';
    case READER_GROUP.VERTICAL:
      return 'Вертикальный режим';
    case READER_GROUP.HORIZONTAL:
      return 'Горизонтальный режим';
    case READER_GROUP.BEHAVIOR:
      return 'Поведение';
  }
};
