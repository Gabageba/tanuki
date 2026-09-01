import { Inject, Injectable } from '@nestjs/common';
import type {
  CatalogResponse,
  ChaptersResponse,
  FiltersResponse,
  MangaDetailsResponse,
  PagesResponse,
} from '@tanuki/contracts';
import type { FilterSelection } from '@tanuki/parsers';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { decodeChapterId, decodeMangaId } from '../common/opaque-id';
import {
  computeBranches,
  normalizeChapter,
  normalizeFilterGroup,
  normalizeManga,
  normalizePage,
  pickDefaultBranch,
} from '../common/normalize';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawChapter } from '../parsers-client/parsers-client.types';

const PAGE_SIZE = 30;

@Injectable()
export class CatalogService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly parsersClient: ParsersClientService,
  ) {}

  async listCatalog(
    sourceId: string,
    params: {
      page: number;
      order?: string;
      direction?: string;
      query?: string;
      force?: boolean;
      filters?: FilterSelection[];
    },
  ): Promise<CatalogResponse> {
    const { data, stale } = await this.parsersClient.listManga(sourceId, params);
    return {
      items: data.items.map((raw) => normalizeManga(this.env, sourceId, raw)),
      page: params.page,
      hasNext: data.items.length >= PAGE_SIZE,
      stale: stale || undefined,
    };
  }

  async listFilters(sourceId: string): Promise<FiltersResponse> {
    const { data } = await this.parsersClient.getFilters(sourceId);
    return { groups: data.groups.map(normalizeFilterGroup) };
  }

  async getMangaDetails(sourceId: string, mangaId: string): Promise<MangaDetailsResponse> {
    const ref = decodeMangaId(mangaId);
    const { data: raw, stale } = await this.parsersClient.getDetails(sourceId, ref.url);
    return {
      manga: normalizeManga(this.env, sourceId, raw),
      branches: computeBranches(raw.chapters ?? []),
      stale: stale || undefined,
    };
  }

  async listChapters(
    sourceId: string,
    mangaId: string,
    branch: string | undefined,
  ): Promise<ChaptersResponse> {
    const ref = decodeMangaId(mangaId);
    const { data: raw, stale } = await this.parsersClient.getDetails(sourceId, ref.url);
    const chapters = raw.chapters ?? [];
    const targetBranch = branch ?? pickDefaultBranch(chapters);
    const filtered = chapters
      .filter((chapter) => chapter.branch === targetBranch)
      .sort((a, b) => a.number - b.number);

    return {
      items: filtered.map((chapter) => normalizeChapter(sourceId, mangaId, chapter)),
      stale: stale || undefined,
    };
  }

  async getPages(sourceId: string, mangaId: string, chapterId: string): Promise<PagesResponse> {
    const chapterRef = decodeChapterId(chapterId);
    const mangaRef = decodeMangaId(mangaId);

    const [pagesResult, detailsResult] = await Promise.all([
      this.parsersClient.getPages(sourceId, chapterRef.url),
      this.parsersClient.getDetails(sourceId, mangaRef.url),
    ]);
    const details = detailsResult.data;

    const siblings = (details.chapters ?? [])
      .filter((chapter) => chapter.branch === chapterRef.branch)
      .sort((a, b) => a.number - b.number);
    const currentIndex = siblings.findIndex((chapter) => chapter.id === chapterRef.id);

    const toChapterId = (chapter: RawChapter | undefined): string | null =>
      chapter ? normalizeChapter(sourceId, mangaId, chapter).id : null;

    return {
      items: pagesResult.data.items.map((page, index) =>
        normalizePage(this.env, sourceId, index, page),
      ),
      prevChapterId: currentIndex > 0 ? toChapterId(siblings[currentIndex - 1]) : null,
      nextChapterId:
        currentIndex >= 0 && currentIndex < siblings.length - 1
          ? toChapterId(siblings[currentIndex + 1])
          : null,
      stale: pagesResult.stale || detailsResult.stale || undefined,
    };
  }
}
