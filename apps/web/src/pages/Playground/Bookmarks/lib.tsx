import type { CSSProperties, MouseEvent } from 'react';
import type { MantineColor } from '@mantine/core';
import {
  ArchiveIcon,
  BookmarkSimpleIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudSlashIcon,
  CoffeeIcon,
  CrownIcon,
  FireIcon,
  FlagIcon,
  GhostIcon,
  HeartIcon,
  LeafIcon,
  LightningIcon,
  MoonIcon,
  PlugsIcon,
  PuzzlePieceIcon,
  QuestionIcon,
  SmileyIcon,
  StarIcon,
  SwordIcon,
  type IconWeight,
} from '@phosphor-icons/react';
import { getMutedBackground } from '@/shared/lib/palette';
import {
  AVAILABILITY,
  BUILT_IN_FOLDER,
  BUILT_IN_STYLE,
  FOLDER_ICON,
  NEW_CHAPTERS_CAP,
  SORT,
  COVER_FILTER,
  UNAVAILABLE_VARIANT,
  type Availability,
  type BuiltInFolder,
  type BuiltInStyle,
  type FolderIcon,
  type MockFolder,
  type ResolvedFolder,
  type Sort,
  type UnavailableVariant,
} from './models';

type IconProps = {
  size?: number;
  weight?: IconWeight;
  color?: string;
};

/** Иконка папки готовым элементом: компонент, полученный вызовом в рендере, ругает линт. */
export const renderFolderIcon = (icon: FolderIcon, props: IconProps = {}) => {
  switch (icon) {
    case FOLDER_ICON.BOOKMARK:
      return <BookmarkSimpleIcon {...props} />;
    case FOLDER_ICON.BOOK_OPEN:
      return <BookOpenIcon {...props} />;
    case FOLDER_ICON.CLOCK:
      return <ClockIcon {...props} />;
    case FOLDER_ICON.CHECK_CIRCLE:
      return <CheckCircleIcon {...props} />;
    case FOLDER_ICON.ARCHIVE:
      return <ArchiveIcon {...props} />;
    case FOLDER_ICON.HEART:
      return <HeartIcon {...props} />;
    case FOLDER_ICON.STAR:
      return <StarIcon {...props} />;
    case FOLDER_ICON.FIRE:
      return <FireIcon {...props} />;
    case FOLDER_ICON.LIGHTNING:
      return <LightningIcon {...props} />;
    case FOLDER_ICON.CROWN:
      return <CrownIcon {...props} />;
    case FOLDER_ICON.SWORD:
      return <SwordIcon {...props} />;
    case FOLDER_ICON.GHOST:
      return <GhostIcon {...props} />;
    case FOLDER_ICON.MOON:
      return <MoonIcon {...props} />;
    case FOLDER_ICON.LEAF:
      return <LeafIcon {...props} />;
    case FOLDER_ICON.COFFEE:
      return <CoffeeIcon {...props} />;
    case FOLDER_ICON.SMILEY:
      return <SmileyIcon {...props} />;
    case FOLDER_ICON.FLAG:
      return <FlagIcon {...props} />;
    case FOLDER_ICON.PUZZLE:
      return <PuzzlePieceIcon {...props} />;
  }
};

export const getBuiltInFolderLabel = (folder: BuiltInFolder) => {
  switch (folder) {
    case BUILT_IN_FOLDER.READING:
      return 'Читаю';
    case BUILT_IN_FOLDER.PLANNED:
      return 'В планах';
    case BUILT_IN_FOLDER.COMPLETED:
      return 'Прочитано';
    case BUILT_IN_FOLDER.DROPPED:
      return 'Брошено';
  }
};

/** I1 — смысловая иконка встроенной папки; I2 — у всех закладка. */
export const getBuiltInFolderIcon = (folder: BuiltInFolder, style: BuiltInStyle): FolderIcon => {
  if (style === BUILT_IN_STYLE.BOOKMARK) return FOLDER_ICON.BOOKMARK;

  switch (folder) {
    case BUILT_IN_FOLDER.READING:
      return FOLDER_ICON.BOOK_OPEN;
    case BUILT_IN_FOLDER.PLANNED:
      return FOLDER_ICON.CLOCK;
    case BUILT_IN_FOLDER.COMPLETED:
      return FOLDER_ICON.CHECK_CIRCLE;
    case BUILT_IN_FOLDER.DROPPED:
      return FOLDER_ICON.ARCHIVE;
  }
};

/** Цвета встроенных — тоже из стандартной палитры; «Брошено» серое: оно про неактивное. */
export const getBuiltInFolderColor = (folder: BuiltInFolder): MantineColor => {
  switch (folder) {
    case BUILT_IN_FOLDER.READING:
      return 'blue';
    case BUILT_IN_FOLDER.PLANNED:
      return 'violet';
    case BUILT_IN_FOLDER.COMPLETED:
      return 'teal';
    case BUILT_IN_FOLDER.DROPPED:
      return 'gray';
  }
};

export const resolveFolder = (folder: MockFolder, style: BuiltInStyle): ResolvedFolder => ({
  id: folder.id,
  isBuiltIn: folder.builtIn !== null,
  name: folder.builtIn ? getBuiltInFolderLabel(folder.builtIn) : (folder.name ?? ''),
  icon: folder.builtIn
    ? getBuiltInFolderIcon(folder.builtIn, style)
    : (folder.icon ?? FOLDER_ICON.BOOKMARK),
  color: folder.builtIn ? getBuiltInFolderColor(folder.builtIn) : (folder.color ?? 'gray'),
  trackUpdates: folder.trackUpdates,
  count: folder.count,
  newCount: folder.newCount,
});

/** Текст и иконка — цветом папки; у серой «Брошено» — цвет пояснений, иначе почти не видно. */
export const getFolderTextColor = (color: MantineColor) =>
  color === 'gray' ? 'var(--mantine-color-dimmed)' : `var(--mantine-color-${color}-text)`;

export const getAvailabilityLabel = (availability: Availability) => {
  switch (availability) {
    case AVAILABILITY.AVAILABLE:
      return null;
    case AVAILABILITY.SOURCE_DISABLED:
      return 'Источник выключен';
    case AVAILABILITY.SOURCE_DOWN:
      return 'Источник недоступен';
    case AVAILABILITY.TITLE_MISSING:
      return 'Тайтл не найден на источнике';
  }
};

/** Иконка причины для плашки на обложке (U2); у доступной закладки иконки нет. */
export const renderAvailabilityIcon = (availability: Availability, props: IconProps = {}) => {
  switch (availability) {
    case AVAILABILITY.AVAILABLE:
      return null;
    case AVAILABILITY.SOURCE_DISABLED:
      return <PlugsIcon {...props} />;
    case AVAILABILITY.SOURCE_DOWN:
      return <CloudSlashIcon {...props} />;
    case AVAILABILITY.TITLE_MISSING:
      return <QuestionIcon {...props} />;
  }
};

export const getSortLabel = (sort: Sort) => {
  switch (sort) {
    case SORT.UPDATED:
      return 'По обновлению';
    case SORT.READ:
      return 'По чтению';
    case SORT.ADDED:
      return 'По дате добавления';
    case SORT.ALPHABETICAL:
      return 'По алфавиту';
  }
};

/** «+3», «+99+» не пишем — больше порога будет «99+». */
export const formatNewCount = (count: number) =>
  count > NEW_CHAPTERS_CAP ? `${NEW_CHAPTERS_CAP}+` : `+${count}`;

/** Обложка-заглушка для моков: стабильная картинка по ключу. */
export const getMockCoverUrl = (seed: string) => `https://picsum.photos/seed/${seed}/300/400`;

/** «1 тайтл», «3 тайтла», «12 тайтлов» — в песочнице без i18n, плюрал руками. */
export const getTitlesCountLabel = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} тайтл`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} тайтла`;
  return `${count} тайтлов`;
};

/** «1 новая глава», «3 новых главы», «12 новых глав»; больше порога — «99+ новых глав». */
export const getNewChaptersPhrase = (count: number) => {
  if (count > NEW_CHAPTERS_CAP) return `${NEW_CHAPTERS_CAP}+ новых глав`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} новая глава`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} новых главы`;
  return `${count} новых глав`;
};

/** Название и мета-строка приглушены: в U1 и обоих U3. */
export const isTitleDimmed = (variant: UnavailableVariant) => {
  switch (variant) {
    case UNAVAILABLE_VARIANT.DIMMED:
    case UNAVAILABLE_VARIANT.DIMMED_PLATE_LIGHT:
    case UNAVAILABLE_VARIANT.DIMMED_PLATE_STRONG:
    case UNAVAILABLE_VARIANT.PLATE_STRONG:
      return true;
    case UNAVAILABLE_VARIANT.COVER_PLATE:
      return false;
  }
};

/** Сила затемнения под плашкой причины; null — плашки нет (U1). */
export const getPlateOpacity = (variant: UnavailableVariant) => {
  switch (variant) {
    case UNAVAILABLE_VARIANT.DIMMED:
      return null;
    case UNAVAILABLE_VARIANT.COVER_PLATE:
      return 0.55;
    case UNAVAILABLE_VARIANT.DIMMED_PLATE_LIGHT:
      return 0.35;
    case UNAVAILABLE_VARIANT.DIMMED_PLATE_STRONG:
    case UNAVAILABLE_VARIANT.PLATE_STRONG:
      return 0.75;
  }
};

/** Что делать с самой обложкой: U1 — серая и бледная, U3a/U3b — серая, остальные — как есть. */
export const getCoverFilter = (variant: UnavailableVariant) => {
  switch (variant) {
    case UNAVAILABLE_VARIANT.DIMMED:
      return COVER_FILTER.DIMMED;
    case UNAVAILABLE_VARIANT.DIMMED_PLATE_LIGHT:
    case UNAVAILABLE_VARIANT.DIMMED_PLATE_STRONG:
      return COVER_FILTER.GRAY;
    case UNAVAILABLE_VARIANT.COVER_PLATE:
    case UNAVAILABLE_VARIANT.PLATE_STRONG:
      return null;
  }
};

/** S4 — цвет папки на месте акцента у выбранного пункта: подложка, рамка и текст. Тот же приём
 *  в «В закладки», меню читалки и модалке склейки. */
export const getFolderTintStyle = (color: MantineColor): CSSProperties => ({
  color: getFolderTextColor(color),
  backgroundColor: getMutedBackground(color, true),
  borderColor: `var(--mantine-color-${color}-filled)`,
});

/** Карточка целиком — ссылка: клик по кнопке внутри неё до карточки доходить не должен. */
export const stopCardClick = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};
