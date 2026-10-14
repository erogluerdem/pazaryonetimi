import { OperationsModule } from '../operations/operations.module';
import { XmlJobWorkerService } from './xml-job-worker.service';
import { Module } from '@nestjs/common';
import { XmlFeedsController } from './xml-feeds.controller';
import { XmlFeedsService } from './xml-feeds.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, OperationsModule],
  controllers: [XmlFeedsController],
  providers: [XmlFeedsService, XmlJobWorkerService],
  exports: [XmlFeedsService],
})
export class XmlFeedsModule {}
