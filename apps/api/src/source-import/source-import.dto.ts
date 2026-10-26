import { createZodDto } from 'nestjs-zod';
import {
  SourceImportPreviewRequestSchema,
  SourceImportPreviewSchema,
  SourceImportRequestSchema,
  SourceImportResultSchema,
} from '@tanuki/contracts';

export class SourceImportPreviewRequestDto extends createZodDto(SourceImportPreviewRequestSchema) {}
export class SourceImportPreviewDto extends createZodDto(SourceImportPreviewSchema) {}
export class SourceImportRequestDto extends createZodDto(SourceImportRequestSchema) {}
export class SourceImportResultDto extends createZodDto(SourceImportResultSchema) {}
