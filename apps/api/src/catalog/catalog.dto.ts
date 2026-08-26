import { createZodDto } from 'nestjs-zod';
import { CatalogResponseSchema, FiltersResponseSchema } from '@tanuki/contracts';

export class CatalogResponseDto extends createZodDto(CatalogResponseSchema) {}
export class FiltersResponseDto extends createZodDto(FiltersResponseSchema) {}
