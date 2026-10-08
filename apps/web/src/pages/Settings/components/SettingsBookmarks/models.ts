import type { EnumLiteralsOf } from '@tanuki/contracts';

/** Что сделать с тайтлами удаляемой папки. */
export const DELETE_FOLDER_ACTION = {
  MOVE: 'move',
  REMOVE: 'remove',
} as const;
export type DeleteFolderAction = EnumLiteralsOf<typeof DELETE_FOLDER_ACTION>;

/** Ширина меню своих папок — у встроенных на его месте пустое место, тумблеры стоят колонкой. */
export const FOLDER_MENU_WIDTH = 28;
