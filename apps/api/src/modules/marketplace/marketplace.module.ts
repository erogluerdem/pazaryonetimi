import { Module, forwardRef } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceConnectionService } from './marketplace-connection.service';
import { MarketplaceBatchTrackerService } from './marketplace-batch-tracker.service';
import { DatabaseModule } from '../../database/database.module';
import { ScrapingModule } from '../scraping/scraping.module';
import { OrdersModule } from '../orders/orders.module';
import { OperationsModule } from '../operations/operations.module';
import { IntegrationSyncQueueModule } from '../integrations-core/queue/integration-sync-queue.module';

@Module({
  imports: [
    DatabaseModule,
    ScrapingModule,
    OrdersModule,
    OperationsModule,
    forwardRef(() => IntegrationSyncQueueModule),
  ],
  providers: [
    MarketplaceService,
    MarketplaceConnectionService,
    MarketplaceBatchTrackerService,
  ],
  controllers: [MarketplaceController],
  exports: [
    MarketplaceService,
    MarketplaceConnectionService,
    MarketplaceBatchTrackerService,
  ],
})
export class MarketplaceModule {}
