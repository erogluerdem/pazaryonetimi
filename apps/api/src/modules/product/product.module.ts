import { SafeBulkService } from './safe-bulk.service';
import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { DatabaseModule } from '../../database/database.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';

@Module({
  imports: [DatabaseModule, MarketplaceModule],
  providers: [ProductService, SafeBulkService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
