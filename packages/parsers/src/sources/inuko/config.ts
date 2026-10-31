import { SOURCE_ID } from '../catalog';

export type InukoConfig = {
  id: string;
  /**
   * Сайт сети в общем API `api.inuko.me`: каталог у всех сайтов один, а этот параметр сужает
   * списки до одного сайта — без него ленты приходят пустыми. Значение самого API (у PureManga —
   * с точкой), поэтому пишется как есть.
   */
  serviceName: string;
};

// title/domains/contentType/isAdult live in SOURCE_CATALOG (../catalog) — look them up by id,
// don't duplicate here.
//
// Сайты сети inuko — один бэкенд, одна SSO и одна раскладка сайта (TanStack Start, SSR-состояние
// seroval, XOR-шифрование страниц общим ключом). Различаются домен и `serviceName`. Их значения
// видны в SSR любого сайта сети (`serviceName:"…"` у карточек соседей); hexnovels — новеллы, их
// tanuki не читает. Проверено 2026-10-27.
export const INUKO_CONFIGS: InukoConfig[] = [
  { id: SOURCE_ID.INKSTORY, serviceName: 'inkstory' },
  { id: SOURCE_ID.PUREMANGA, serviceName: 'puremanga.me' },
];
