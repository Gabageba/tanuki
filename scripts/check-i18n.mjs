#!/usr/bin/env node
// Проверка словарей apps/web/src/shared/locales/{ru,en}.json против кода apps/web/src.
// Запуск: pnpm lint:i18n (входит в pnpm lint и lint-staged).
// Код выхода 1, если есть ошибки (missing / рассинхрон ru↔en); предупреждения кода не меняют.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'apps/web/src');
const LOCALES = join(SRC, 'shared/locales');
const SKIP_DIRS = new Set(['node_modules', 'Playground', 'locales']);

const RU_PLURALS = ['one', 'few', 'many', 'other'];
const EN_PLURALS = ['one', 'other'];
const PLURAL_RE = /_(zero|one|two|few|many|other)$/;

const ru = JSON.parse(readFileSync(join(LOCALES, 'ru.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(LOCALES, 'en.json'), 'utf8'));

const errors = [];
const warnings = [];

const baseOf = (key) => key.replace(PLURAL_RE, '');
const groupPlurals = (dict) => {
  const groups = new Map();
  for (const key of Object.keys(dict)) {
    const base = baseOf(key);
    if (!groups.has(base)) groups.set(base, new Set());
    const form = key.match(PLURAL_RE)?.[1];
    if (form) groups.get(base).add(form);
  }
  return groups;
};

const ruGroups = groupPlurals(ru);
const enGroups = groupPlurals(en);

// 1. Значения — строки, словари плоские
for (const [name, dict] of [
  ['ru', ru],
  ['en', en],
]) {
  for (const [key, value] of Object.entries(dict)) {
    if (typeof value !== 'string')
      errors.push(`${name}.json: «${key}» — не строка (словари плоские)`);
    else if (!value.trim()) errors.push(`${name}.json: «${key}» — пустое значение`);
  }
}

// 2. ru ↔ en: одинаковый набор базовых ключей и полный набор plural-форм
for (const base of ruGroups.keys()) {
  if (!enGroups.has(base)) errors.push(`en.json: нет ключа «${base}» (есть в ru.json)`);
}
for (const base of enGroups.keys()) {
  if (!ruGroups.has(base)) errors.push(`ru.json: нет ключа «${base}» (есть в en.json)`);
}
for (const [base, forms] of ruGroups) {
  if (forms.size && RU_PLURALS.some((f) => !forms.has(f)))
    errors.push(`ru.json: «${base}» — неполные plural-формы, нужны ${RU_PLURALS.join('/')}`);
  if (!forms.size && ru[base] === undefined) errors.push(`ru.json: «${base}» — битый ключ`);
}
for (const [base, forms] of enGroups) {
  if (forms.size && EN_PLURALS.some((f) => !forms.has(f)))
    errors.push(`en.json: «${base}» — неполные plural-формы, нужны ${EN_PLURALS.join('/')}`);
}
for (const [base, ruForms] of ruGroups) {
  const enForms = enGroups.get(base);
  if (enForms && !!ruForms.size !== !!enForms.size)
    errors.push(`«${base}» — plural в одном словаре и обычный ключ в другом`);
}

// 3. Интерполяции совпадают
const varsOf = (value) => new Set([...value.matchAll(/\{\{\s*(\w+)[^}]*\}\}/g)].map((m) => m[1]));
for (const [base] of ruGroups) {
  const ruKeys = Object.keys(ru).filter((k) => baseOf(k) === base);
  const enKeys = Object.keys(en).filter((k) => baseOf(k) === base);
  if (!enKeys.length) continue;
  const ruVars = new Set(ruKeys.flatMap((k) => [...varsOf(ru[k])]));
  const enVars = new Set(enKeys.flatMap((k) => [...varsOf(en[k])]));
  const diff = [...ruVars]
    .filter((v) => !enVars.has(v))
    .concat([...enVars].filter((v) => !ruVars.has(v)));
  if (diff.length) errors.push(`«${base}» — разные интерполяции в ru/en: ${diff.join(', ')}`);
  const tags = (v) =>
    [...v.matchAll(/<(\w+)\s*\/?>/g)]
      .map((m) => m[1])
      .sort()
      .join(',');
  const ruTags = tags(ruKeys.map((k) => ru[k]).join(' '));
  const enTags = tags(enKeys.map((k) => en[k]).join(' '));
  if (new Set(ruTags.split(',')).size !== new Set(enTags.split(',')).size)
    warnings.push(`«${base}» — разные <теги> для <Trans> в ru/en`);
}

// 4. Типографика ru: число + сокращение через неразрывный пробел
const ABBR = '(гл|стр|т|дн|мес|ч|мин|с|г)\\b';
const plainSpace = new RegExp(`(\\}\\}|\\d) ${ABBR}|${ABBR}\\. (\\{\\{|\\d)`);
const glued = new RegExp(`(\\}\\}|\\d)${ABBR}`);
for (const [key, value] of Object.entries(ru)) {
  if (plainSpace.test(value))
    warnings.push(
      `ru.json: «${key}» — обычный пробел между числом и сокращением, нужен \\u00a0: ${JSON.stringify(value)}`,
    );
  if (glued.test(value))
    warnings.push(`ru.json: «${key}» — число склеено с сокращением: ${JSON.stringify(value)}`);
}

// 5. Ключи из кода
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return SKIP_DIRS.has(name) ? [] : walk(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });

const files = walk(SRC);
const usedLiterals = new Set();
const callKeys = new Map(); // key -> first location
const dynamicCalls = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  for (const m of text.matchAll(/['"`]([A-Za-z][\w.]*)['"`]/g)) usedLiterals.add(m[1]);
  const lineOf = (index) => text.slice(0, index).split('\n').length;
  for (const m of text.matchAll(/\bt\(\s*(['"])([^'"]+)\1/g))
    if (!callKeys.has(m[2])) callKeys.set(m[2], `${rel}:${lineOf(m.index)}`);
  for (const m of text.matchAll(/i18nKey=\{?\s*(['"])([^'"]+)\1/g))
    if (!callKeys.has(m[2])) callKeys.set(m[2], `${rel}:${lineOf(m.index)}`);
  for (const m of text.matchAll(/\bt\(\s*([A-Za-z_$][\w$.]*)\s*[,)]/g))
    dynamicCalls.push(`${rel}:${lineOf(m.index)} — t(${m[1]})`);
  for (const m of text.matchAll(/\bt\(\s*`/g))
    dynamicCalls.push(`${rel}:${lineOf(m.index)} — t(\`…\`)`);
}

for (const [key, where] of callKeys) {
  if (!ruGroups.has(key) || (ru[key] === undefined && !ruGroups.get(key)?.size))
    errors.push(`${where}: ключа «${key}» нет в ru.json`);
  if (!enGroups.has(key)) errors.push(`${where}: ключа «${key}» нет в en.json`);
}

// 6. Неиспользуемые ключи: базовое имя не встречается в коде ни одним строковым литералом и ни
// одним вложенным `$t(key)` в самих словарях
for (const value of Object.values(ru)) {
  for (const m of String(value).matchAll(/\$t\(([A-Za-z][\w.]*)/g)) usedLiterals.add(m[1]);
}
const unused = [...ruGroups.keys()].filter((base) => !usedLiterals.has(base));
for (const base of unused) warnings.push(`ru.json/en.json: «${base}» нигде не используется`);

// 7. Одинаковые русские значения под разными ключами
const byValue = new Map();
for (const [key, value] of Object.entries(ru)) {
  if (PLURAL_RE.test(key)) continue;
  byValue.set(value, [...(byValue.get(value) ?? []), key]);
}
for (const [value, keys] of byValue)
  if (keys.length > 1)
    warnings.push(`ru.json: одно значение ${JSON.stringify(value)} под ключами ${keys.join(', ')}`);

const print = (title, list) => {
  if (!list.length) return;
  console.log(`\n${title} (${list.length}):`);
  for (const line of list) console.log(`  - ${line}`);
};

console.log(`i18n: ${files.length} файлов, ${ruGroups.size} ключей ru, ${enGroups.size} ключей en`);
print('ОШИБКИ', errors);
print('Предупреждения', warnings);
print('Динамические ключи — проверь вручную, что все варианты есть в обоих словарях', dynamicCalls);
if (!errors.length) console.log('\nОшибок нет.');
process.exit(errors.length ? 1 : 0);
