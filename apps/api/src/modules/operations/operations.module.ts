import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { EncryptionModule } from '../../common/encryption.module';
import { XmlJobQueueService } from './xml-job-queue.service';
import { OperationsAlertsService } from './operations-alerts.service';
import { OperationsController } from './operations.controller';
@Global()
@Module({ imports: [DatabaseModule, EncryptionModule], providers: [XmlJobQueueService, OperationsAlertsService], controllers: [OperationsController], exports: [XmlJobQueueService, OperationsAlertsService] })
export class OperationsModule {}
