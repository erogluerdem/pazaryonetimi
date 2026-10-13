import { Module, forwardRef } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceConnectionService } from './marketplace-connection.service';
import { DatabaseModule } from '../../database/database.module';
import { ScrapingModule } from '../scraping/scraping.module';
import { OrdersModule } from '../orders/orders.module';
import { IntegrationSyncQueueModule } from '../integrations-core/queue/integration-sync-queue.module';

@Module({
  imports: [
    DatabaseModule,
    ScrapingModule,
    OrdersModule,
    forwardRef(() => IntegrationSyncQueueModule),
  ],
  providers: [MarketplaceService, MarketplaceConnectionService],
  controllers: [MarketplaceController],
  exports: [MarketplaceService, MarketplaceConnectionService],
})
export class MarketplaceModule {}
