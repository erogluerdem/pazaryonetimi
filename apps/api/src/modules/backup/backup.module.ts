import { OperationsModule } from '../operations/operations.module';
import { BackupArchiveStore } from './backup-archive.store';
import { PostgresBackupRunner } from './postgres-backup.runner';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Module({
  imports: [DatabaseModule, OperationsModule],
  providers: [BackupService, BackupArchiveStore, PostgresBackupRunner],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
