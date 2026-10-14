import { SafeBulkService } from './safe-bulk.service';
import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ProductService, SafeBulkService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
