export type SenkuroCollection = {
  id: string;
  name: string;
  entityType: string;
  status: string | null;
  system: boolean;
  preference?: { name?: string | null };
};

export type SenkuroViewer = {
  user: { id: string; name: string } | null;
  userBookmarkCollections: SenkuroCollection[];
};

export type SenkuroBookmarkManga = {
  __typename: string;
  id: string;
  slug: string;
  applicationId: string;
  titles?: { lang?: string; content?: string }[];
  cover?: { original?: { url?: string } };
  type?: string;
  rating?: string;
};

export type SenkuroBookmarkConnection = {
  edges: {
    node: {
      collectionId: string;
      number: number | string | null;
      entity: SenkuroBookmarkManga | null;
    };
  }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};
