/**
 * Промежуточный брейкпоинт между `base` и стандартным `xs` (36em) Mantine. Заведён в теме
 * (`app/Providers/MantineProvider`) как `breakpoints.xxs` — прокидывается в `visibleFrom`/
 * `hiddenFrom` и responsive-пропы вроде `SimpleGrid.cols={{ base, xxs }}`.
 */
export const XXS_BREAKPOINT = '26em';

/**
 * Для пропов без поддержки responsive-объекта (`Group.gap` типизирован как `MantineSpacing`, а
 * не `StyleProp`) резолвьте брейкпоинт вручную через `useMediaQuery(XXS_QUERY)` — `useMatches`
 * не годится, он знает только про стандартные брейкпоинты Mantine.
 */
export const XXS_QUERY = `(min-width: ${XXS_BREAKPOINT})`;
