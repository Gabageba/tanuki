import { Inject, Injectable } from '@nestjs/common';
import { SOURCE_AUTH_FAMILY, catalogEntryFor } from '@tanuki/contracts';
import type {
  CatalogResponse,
  ResolvedSearchFilters,
  SearchFilterCriteria,
  ChaptersResponse,
  FiltersResponse,
  TitleDetailsResponse,
  PagesResponse,
} from '@tanuki/contracts';
import type { FilterSelection } from '@tanuki/parsers';
import type { Env } from '../config/env';
import { ENV } from '../config/env.module';
import { decodeChapterId, decodeTitleId } from '../common/opaque-id';
import {
  compareChapterNumber,
  compareChapterNumberDesc,
  computeBranches,
  detectNumbering,
  normalizeChapter,
  normalizeFilterGroup,
  normalizeTitle,
  normalizePage,
  pickDefaultBranch,
  toBranchKey,
} from '../common/normalize';
import { AdultContentService } from '../adult-content/adult-content.service';
import { TitleSnapshotsService } from '../library/title-snapshots.service';
import { ParsersClientService } from '../parsers-client/parsers-client.service';
import type { RawChapter } from '../parsers-client/parsers-client.types';

const PAGE_SIZE = 30;

@Injectable()
export class CatalogService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly parsersClient: ParsersClientService,
    private readonly adultContent: AdultContentService,
    private readonly snapshots: TitleSnapshotsService,
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
    const { data, stale } = await this.parsersClient.listTitles(sourceId, params);
    return {
      items: data.items.map((raw) => normalizeTitle(this.env, sourceId, raw)),
      page: params.page,
      hasNext: data.items.length >= PAGE_SIZE,
      stale: stale || undefined,
    };
  }

  /** Критерии поиска как фильтры источника — см. ParsersClientService.resolveSearchFilters. */
  resolveSearchFilters(sourceId: string, criteria: SearchFilterCriteria): ResolvedSearchFilters {
    return this.parsersClient.resolveSearchFilters(sourceId, criteria);
  }

  async listFilters(sourceId: string): Promise<FiltersResponse> {
    const { data } = await this.parsersClient.getFilters(sourceId);
    return { groups: data.groups.map(normalizeFilterGroup) };
  }

  async getTitleDetails(sourceId: string, titleId: string): Promise<TitleDetailsResponse> {
    const ref = decodeTitleId(titleId);
    const { data: raw, stale } = await this.parsersClient.getDetails(sourceId, ref.url);
    await this.adultContent.assertTitleVisible(sourceId, raw.contentRating);
    return {
      title: normalizeTitle(this.env, sourceId, raw),
      branches: computeBranches(raw.chapters ?? []),
      stale: stale || undefined,
    };
  }

  async listChapters(
    sourceId: string,
    titleId: string,
    branch: string | undefined,
  ): Promise<ChaptersResponse> {
    const ref = decodeTitleId(titleId);
    const { data: raw, stale } = await this.parsersClient.getDetails(sourceId, ref.url);
    await this.adultContent.assertTitleVisible(sourceId, raw.contentRating);
    // Дотяжка: открытая страница тайтла обновляет его снимок глав — новые главы закладок видны и
    // без крона. Пишется то, что уходит клиенту, так что кеш деталей этому не мешает.
    this.snapshots.recordQuietly(sourceId, ref.url, raw);
    const chapters = raw.chapters ?? [];
    const targetBranch = branch === undefined ? pickDefaultBranch(chapters) : toBranchKey(branch);
    const filtered = chapters
      .filter((chapter) => chapter.branch === targetBranch)
      .sort(compareChapterNumberDesc);

    return {
      items: filtered.map((chapter) => normalizeChapter(sourceId, titleId, chapter)),
      numbering: detectNumbering(filtered),
      stale: stale || undefined,
    };
  }

  async getPages(sourceId: string, titleId: string, chapterId: string): Promise<PagesResponse> {
    const chapterRef = decodeChapterId(chapterId);
    const titleRef = decodeTitleId(titleId);

    // Где бывают платные главы, сначала нужны детали: по ним видно, платная ли глава, а страницы
    // платной главы в общий кеш не кладутся. Глава, которой нет в деталях этого зрителя, тоже
    // считается платной — общий кеш не должен отдавать то, что ему не показали.
    const hasPaidChapters = catalogEntryFor(sourceId).authFamily === SOURCE_AUTH_FAMILY.LIBSOCIAL;
    const [pagesResult, detailsResult] = hasPaidChapters
      ? await this.parsersClient.getDetails(sourceId, titleRef.url).then(async (details) => {
          const chapter = details.data.chapters?.find((item) => item.id === chapterRef.id);
          const pages = await this.parsersClient.getPages(sourceId, chapterRef.url, {
            isPaid: !chapter || chapter.isPaid === true,
          });
          return [pages, details] as const;
        })
      : await Promise.all([
          this.parsersClient.getPages(sourceId, chapterRef.url),
          this.parsersClient.getDetails(sourceId, titleRef.url),
        ]);
    const details = detailsResult.data;
    await this.adultContent.assertTitleVisible(sourceId, details.contentRating);

    const siblings = (details.chapters ?? [])
      .filter((chapter) => chapter.branch === chapterRef.branch)
      .sort(compareChapterNumber);
    const currentIndex = siblings.findIndex((chapter) => chapter.id === chapterRef.id);

    const toChapterId = (chapter: RawChapter | undefined): string | null =>
      chapter ? normalizeChapter(sourceId, titleId, chapter).id : null;

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
