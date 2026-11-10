import { describe, expect, it, vi } from 'vitest';
import { SOURCE_ID } from '@tanuki/contracts';
import type { Env } from '../config/env';
import type { AdultContentService } from '../adult-content/adult-content.service';
import type { TitleSnapshotsService } from '../library/title-snapshots.service';
import type { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawChapter, RawTitle } from '../parsers-client/parsers-client.types';
import { NotFoundApiException, SourceUnavailableException } from '../common/errors';
import { encodeChapterId, encodeTitleId } from '../common/opaque-id';
import { CatalogService } from './catalog.service';

const TITLE_ID = encodeTitleId({ id: 1, url: 'book-id' });
const CHAPTER_ID = encodeChapterId({ id: 2, url: 'chapter-id', branch: null });
const CHAPTER: RawChapter = {
  id: 2,
  url: 'book-id/chapter-id',
  title: null,
  number: 1,
  volume: 1,
  scanlator: null,
  branch: null,
  uploadDate: 0,
  source: SOURCE_ID.INKSTORY,
};

const makeService = (error: Error, chapters: RawChapter[] = [CHAPTER]) => {
  const parsers = {
    getDetails: vi.fn().mockResolvedValue({
      data: { contentRating: null, chapters } as RawTitle,
      stale: false,
    }),
    getPages: vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue({
        data: {
          items: [
            {
              id: 3,
              url: 'https://static.inuko.me/page.png',
              preview: null,
              source: SOURCE_ID.INKSTORY,
            },
          ],
        },
        stale: false,
      }),
  };
  const service = new CatalogService(
    { IMG_SIGN_SECRET: 'test-secret' } as Env,
    parsers as unknown as ParsersClientService,
    { assertTitleVisible: vi.fn().mockResolvedValue(undefined) } as unknown as AdultContentService,
    {} as TitleSnapshotsService,
  );
  return { service, parsers };
};

describe('CatalogService reader URL migration', () => {
  it('opens a saved chapter link using the current URL after the old URL returns 404', async () => {
    const { service, parsers } = makeService(new NotFoundApiException());
    const result = await service.getPages(SOURCE_ID.INKSTORY, TITLE_ID, CHAPTER_ID);
    expect(result.items).toHaveLength(1);
    expect(parsers.getPages.mock.calls).toEqual([
      [SOURCE_ID.INKSTORY, 'chapter-id'],
      [SOURCE_ID.INKSTORY, 'book-id/chapter-id'],
    ]);
    expect(parsers.getDetails).toHaveBeenCalledOnce();
  });

  it('keeps a real missing chapter as 404', async () => {
    const error = new NotFoundApiException();
    const { service, parsers } = makeService(error, []);
    await expect(service.getPages(SOURCE_ID.INKSTORY, TITLE_ID, CHAPTER_ID)).rejects.toBe(error);
    expect(parsers.getPages).toHaveBeenCalledOnce();
    expect(parsers.getDetails).toHaveBeenLastCalledWith(SOURCE_ID.INKSTORY, 'book-id', {
      force: true,
    });
  });

  it('refreshes cached retired URLs and returns sibling links from refreshed details', async () => {
    const { service, parsers } = makeService(new NotFoundApiException());
    const nextChapter = { ...CHAPTER, id: 4, number: 2, url: 'book-id/next-chapter' };
    parsers.getDetails
      .mockResolvedValueOnce({
        data: { contentRating: null, chapters: [{ ...CHAPTER, url: 'chapter-id' }] } as RawTitle,
        stale: false,
      })
      .mockResolvedValue({
        data: { contentRating: null, chapters: [CHAPTER, nextChapter] } as RawTitle,
        stale: false,
      });

    const result = await service.getPages(SOURCE_ID.INKSTORY, TITLE_ID, CHAPTER_ID);

    expect(parsers.getDetails.mock.calls).toEqual([
      [SOURCE_ID.INKSTORY, 'book-id'],
      [SOURCE_ID.INKSTORY, 'book-id', { force: true }],
    ]);
    expect(parsers.getPages.mock.calls).toEqual([
      [SOURCE_ID.INKSTORY, 'chapter-id'],
      [SOURCE_ID.INKSTORY, 'book-id/chapter-id'],
    ]);
    expect(result.nextChapterId).toBe(
      `${SOURCE_ID.INKSTORY}:${encodeChapterId({ id: nextChapter.id, url: nextChapter.url, branch: null })}`,
    );
  });

  it('refreshes details when the requested chapter is absent from cached details', async () => {
    const { service, parsers } = makeService(new NotFoundApiException());
    parsers.getDetails.mockResolvedValueOnce({
      data: { contentRating: null, chapters: [] } as unknown as RawTitle,
      stale: false,
    });

    const result = await service.getPages(SOURCE_ID.INKSTORY, TITLE_ID, CHAPTER_ID);

    expect(result.items).toHaveLength(1);
    expect(parsers.getDetails).toHaveBeenLastCalledWith(SOURCE_ID.INKSTORY, 'book-id', {
      force: true,
    });
  });

  it('does not retry an unchanged URL', async () => {
    const error = new NotFoundApiException();
    const { service, parsers } = makeService(error, [{ ...CHAPTER, url: 'chapter-id' }]);
    await expect(service.getPages(SOURCE_ID.INKSTORY, TITLE_ID, CHAPTER_ID)).rejects.toBe(error);
    expect(parsers.getPages).toHaveBeenCalledOnce();
  });

  it('does not retry a network error even when the chapter URL changed', async () => {
    const error = new SourceUnavailableException(SOURCE_ID.INKSTORY);
    const { service, parsers } = makeService(error);
    await expect(service.getPages(SOURCE_ID.INKSTORY, TITLE_ID, CHAPTER_ID)).rejects.toBe(error);
    expect(parsers.getPages).toHaveBeenCalledOnce();
  });
});
