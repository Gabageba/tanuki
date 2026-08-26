import type useCatalog from './hooks/useCatalog';

export type CatalogQuery = ReturnType<typeof useCatalog>;
export type CatalogParams = Parameters<typeof useCatalog>[0];
