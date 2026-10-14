// These used to mirror kotatsu-parsers-redo's data classes as the Kotlin sidecar's Jackson
// layer serialized them. The sidecar is gone — the wire shape now originates directly in
// packages/parsers/src/types.ts, and this file only re-exports it so normalize.ts and
// catalog.service.ts don't need to change their import paths.

export type {
  RawTag,
  RawContentRating,
  RawTitle,
  RawChapter,
  RawPage,
  RawSourceInfo,
  RawFilterGroup,
  RawFilterOption,
  RawHomeSection,
  RawHomeSectionPage,
  RawHomeSectionParams,
} from '@tanuki/parsers';
