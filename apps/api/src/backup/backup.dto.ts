import { createZodDto } from 'nestjs-zod';
import {
  BackupPreviewRequestSchema,
  BackupPreviewSchema,
  BackupRestoreResultSchema,
  BackupSchema,
  RestoreBackupRequestSchema,
} from '@tanuki/contracts';

export class BackupDto extends createZodDto(BackupSchema) {}
export class BackupPreviewRequestDto extends createZodDto(BackupPreviewRequestSchema) {}
export class BackupPreviewDto extends createZodDto(BackupPreviewSchema) {}
export class RestoreBackupRequestDto extends createZodDto(RestoreBackupRequestSchema) {}
export class BackupRestoreResultDto extends createZodDto(BackupRestoreResultSchema) {}
