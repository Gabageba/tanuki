# Code style rules

## Components

- Every UI component lives in its own file and is exported via `export default`.
- Components are always written as a `function` declaration — never an arrow function assigned to a
  const.
- The `export default` goes **after** the component declaration, on its own line at the end of the
  file (`function SourceCard() {...}` … `export default SourceCard;`) — never inline on the
  declaration.
- No `index.ts` barrels that only import a component and re-export it. Import components straight
  from their own file.
- Elements with no children are self-closing — `<ActionIcon />`, never
  `<ActionIcon></ActionIcon>`.

## Types

- Always `type`, never `interface`.
- Component props are always declared as `type Props = { ... }` — exactly `Props`, no
  `SourceCardProps`-style prefixes.
- No loose string literals in types: no `z.enum([...])`, no `'ok' | 'degraded' | 'down'`, no arrays
  of strings with a manual cast. Declare the literals once in a const object and derive the type
  from it with `EnumLiteralsOf` (`packages/contracts/src/utils.ts`):

  ```ts
  export const SOURCE_STATUS = {
    OK: 'ok',
    DEGRADED: 'degraded',
    DOWN: 'down',
  } as const;
  export type SourceStatus = EnumLiteralsOf<typeof SOURCE_STATUS>;
  ```

  Keep one such const per concept — don't copy it into parsers, contracts and API separately; reuse
  the shared one from `@tanuki/contracts`.

- Never transform those enum values in API responses (no case changes, no renaming) — whatever is
  in the const is what the frontend receives, so it can work with the values directly.
- Types and anything else bulky enough to clutter a file go into a sibling `models.ts`.

## Constants

- Constant names are UPPERCASE — `THEME`, `PRIMARY_SHADE`, `COLOR_SCHEME_MANAGER`, never `theme` or
  `colorSchemeManager`. An enum-like const object always follows `{ SCREAM_CASE: camelCase }` —
  keys UPPERCASE, values camelCase (`LIGHT: 'light'`, `RATING_COUNT: 'ratingCount'`) — even when
  the concept itself reads uppercase (an HTTP-style error code stays `NOT_FOUND: 'notFound'`, not
  `NOT_FOUND: 'NOT_FOUND'`). The one exception is a value pinned by an external contract this
  codebase doesn't own — a field mirrored verbatim from a source site's own JSON API response, or a
  value typed against a third-party library (e.g. `COLOR_SCHEME` against Mantine's
  `MantineColorScheme`) — where the value must stay exactly what that external contract expects.
- No lookup tables mapping an enum to labels, icons, colors and the like
  (`Record<ColorScheme, string>`). Write an arrow function with an exhaustive `switch` instead — no
  `default` branch, so TypeScript points at the missing case when a value is added to the enum:

  ```ts
  export const getColorSchemeLabel = (colorScheme: ColorScheme, t: TFunction) => {
    switch (colorScheme) {
      case COLOR_SCHEME.LIGHT:
        return t('light');
      case COLOR_SCHEME.DARK:
        return t('dark');
      case COLOR_SCHEME.AUTO:
        return t('system');
    }
  };
  ```

  A helper like this can't call `useTranslation()` itself — it isn't a hook — so it takes the
  already-obtained `t` as a parameter; the calling component still calls the hook directly (see
  Localization below).

  When such a function has to produce a React icon, it returns the rendered element
  (`return <SunIcon size={size} />`), not the component itself — a component obtained from a call
  during render is recreated on every render, and `react-hooks/static-components` fails the lint.
  That makes it a `.tsx` helper, so it lives next to the component rather than in `models.ts`.

## Text

- Placeholder for a missing/empty value — no rating, no reason, no error — is never a raw `'—'`
  string literal. Use the shared `<Mdash />` component (`apps/web/src/shared/ui/Mdash.tsx`), which
  renders `&mdash;`.

## Placement

- Keep code next to its only consumer: constants of a component go into its sibling `models.ts` or
  straight into the component file when there are just a couple of them.
- `shared/` is for things with more than one consumer — and for generic UI building blocks that
  know nothing about the feature they're used in and are expected to be reused elsewhere, even if
  there's only one call site today (`BarChart`, `ProgressList`: they take plain data via props, no
  feature types, mocks or domain logic inside). A feature-specific component stays next to its
  consumer until a second one actually appears. Don't create a folder in `shared/` for a single
  import.
- No one-call wrappers around library hooks. Call the library hook in the component.

## Colors

- The accent color is declared once in `apps/web/src/app/components/Providers/models.ts`
  (`PRIMARY_COLOR`, `PRIMARY_COLOR_SHADES`, `PRIMARY_SHADE`) and reaches components through the
  Mantine theme — `color={PRIMARY_COLOR}`, `var(--mantine-primary-color-filled)`.
- Everything else takes colors from Mantine CSS variables (`var(--mantine-color-*)`) so both color
  schemes work. A hard-coded hex needs a reason in a comment — for example the always-black reader
  background.

## Typography

- Two font families, one role each — no brand-layer exception. Both are wired up once in
  `apps/web/src/app/Providers/models.ts` and reach components the same way colors do — through the
  Mantine theme, never re-imported per file.
- The question to ask is never "is this a number?" but **"is this speech or a readout?"** — a
  string that can be read aloud as a phrase is speech, a string the eye scans down a column and
  compares between rows is a readout. When in doubt: if neighbouring rows have to line up by their
  digits, it's monospace.
- **Golos Text** — the interface default (`theme.fontFamily`, `FONT_FAMILY_SANS`), so it needs no
  `ff` at all. Everything is set in it unless it's a readout or the logo: titles, headings,
  navigation, buttons, descriptions, reviews, field labels, tag names, breadcrumbs built out of
  names, worded dates ("12 фев 2026", `formatDate`), relative time ("2 дня назад",
  `formatRelative`), and any phrase that merely contains a number ("Глава 3 из 120", "Скачано
  12 гл.") — a number inside a sentence doesn't turn the sentence into data.
- **JetBrains Mono** — the readout layer (`theme.fontFamilyMonospace`, use via `ff="monospace"`).
  Numeric dates ("01.02.2026", `formatDateNumeric`), chapter and page numbers in a list, counters
  and `+N` tags, percentages, rating digits, badge tags (`18+`, `VPN`, `NEW`), locale and status
  codes, small uppercase service labels, and technical identifiers (domain, id, url, slug).
- A mixed row is fine: in a card's meta line the type stays Golos Text while the year and the
  chapter counter go monospace (`NumericMeta`) — the rule applies per value, not per row.
- **Unbounded** — the logo only, one call site (`var(--tanuki-font-brand)`, set in
  `CSS_VARIABLES_RESOLVER`, used in the header `Anchor`). Nowhere else — block headings, section
  names, and modal titles all use Golos Text now.

## Hooks

- Hooks live in a `hooks` folder. If a hook belongs to one specific component, it goes into that
  component's own `hooks` folder.
- Hooks are written as a `function` declaration and exported via `export default` too (after the
  declaration, same as components).

## Functions

- Only components and hooks use `function` + `export default`. Every other function — helpers,
  formatters, guards, mappers, request builders — is an arrow function assigned to a const and
  exported as a **named** export (no `export default`).

  ```ts
  // component / hook
  function SourceCard() { ... }
  export default SourceCard;

  // helper
  export const formatChapterNumber = (value: number) => ...;
  ```

## Dates

- Always send dates and times in the standard server format: `YYYY-MM-DD`, or
  `YYYY-MM-DDTHH:MM:SSZ` when the time is needed.

## Localization

- All UI text goes through `react-i18next`. Call the library hook directly in the component —
  `const { t } = useTranslation();` — no wrapper hook. Dictionaries live in
  `apps/web/src/shared/locales/{ru,en}.json`.
- **Russian is the base language.** `ru.json` holds the source text, `en.json` is its translation,
  so a key is named after the Russian value.
- **A key name is the literal English translation of that value**, or the closest thing to it:
  «Нестабилен» → `unstable`, not `degraded`; «Это он» → `thisIsIt`, not `matchConfirm`; «Анонс» →
  `announcement`, not `upcoming`.
- **One value, one key.** Before adding a key, look for the same Russian text in `ru.json` and reuse
  that key — never a second name for a string that's already there (`bookmarks` _and_
  `byBookmarks`). Two keys colliding only in `en.json` while their Russian differs
  (`miscellaneous` «Прочее» / `other` «Другое», both "Other") are not duplicates.
- **The name never depends on where the string is used** — not the page or component
  (`catalog.filters.cancel`), not the UI role it fills at its first call site (no `xxxPlaceholder`,
  `xxxTitle`, `xxxTooltip`, `xxxMessage` suffix), and not the enum whose value it renders
  (`colorSchemeLight`, `cacheResetTitle`). The same key has to fit just as well the next time that
  text is needed as a label, a tooltip or a button.
- **The name makes the text itself obvious.** `main` for «Основная» — yes; `mainBranch` — no, that's
  already a guess about the call site rather than the content.
- **A long value gets a short name that keeps the point.** A whole sentence never turns into a key:
  «Откройте нужный тайтл на другом источнике и вставьте сюда ссылку из адресной строки.» →
  `pasteLinkFromOtherSource`. It's the name that gets shortened, not the text.
- **A word form is a suffix, and only when two keys collide.** While a word appears in one form, its
  key carries no form suffix. The moment the same text is needed in another form, the base form
  keeps the plain name and the new one spells the form out in full —
  `chapters` / `chaptersGenitive` / `chaptersDative`, `light` / `lightMasculine` — never a
  `chaptersGen`-style abbreviation.
- Keys are flat — no nesting by feature area, not even for generic, everywhere-reused action words
  (`cancel`, `apply`, `add`, `reset`, `retry`, `error` live at the top level, not under `common`).
- A pure helper (not a component/hook) that needs translated text — the `getXxxLabel` switch
  helpers from the Constants section above are the common case — takes `t: TFunction` (from
  `i18next`) as a parameter and calls `t('key')` in each branch; it does not call the hook itself.
- Numbers that decline by count use i18next plural keys (`_one`/`_few`/`_many`/`_other` for `ru`,
  `_one`/`_other` for `en`) with `t('key', { count })` — not a single hardcoded word form. Skip the
  plural suffixes only when the word genuinely doesn't decline (an abbreviation like `гл.`, an
  invariant participle like `выбрано`).
- **Never build a sentence out of several `t()` calls placed side by side**
  (`{t('downloaded')} {t('countChaptersAbbrev', { count })}`). Word order and grammar differ
  between languages, so a phrase assembled from independently-translated pieces breaks the moment
  it's translated. Give the whole phrase its own single key with interpolation instead
  (`downloadedChaptersAbbrev`: «Скачано {{count}} гл.»), even if part of that value duplicates
  another key's text.

## Playground

- Mock-ups of UI variants live in `apps/web/src/pages/Playground/<Task>/`, one page per task, listed
  in `PLAYGROUND_TASKS` (`apps/web/src/pages/Playground/models.ts`). Their texts skip i18n.
- Once a variant is chosen, the page is **kept** as a record of the decision, not deleted: fill in
  the task's `decision` and describe the chosen variant in the relevant `docs/` file.
- Playground routes are registered only under `import.meta.env.DEV` (`RouterProvider.tsx`), so the
  pages never reach the production build. Keep it that way for every new page.
