import { SafeBulkService } from './safe-bulk.service';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  Query,
  Req,
  Res,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ProductService } from './product.service';
import type { Response } from 'express';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Permission } from '../rbac/rbac.service';

@Controller('products')
@UseGuards(PermissionsGuard)
export class ProductController {
  constructor(private readonly productService: ProductService, private readonly safeBulk: SafeBulkService) {}

  @Post('bulk-action/preview')
  @RequirePermission(Permission.PRODUCT_EDIT)
  previewBulk(@Req() req: any, @Body() body: any) { return this.safeBulk.preview(req.user.tenantId, req.user.id, body); }

  @Post('bulk-action')
  @RequirePermission(Permission.PRODUCT_EDIT)
  async executeBulkAction(
    @Headers('x-tenant-id') tenantId: string,
    @Body() data: { action: string; productIds: string[]; [key: string]: any },
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.productService.executeBulkAction({ ...data, tenantId, userId });
  }

  @Post('bulk-action/:id/rollback')
  @RequirePermission(Permission.PRODUCT_EDIT)
  async rollbackBulkAction(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') bulkActionId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.productService.rollbackBulkAction(tenantId, bulkActionId, userId);
  }

  @Get('bulk-action-history')
  async getBulkActionHistory(@Headers('x-tenant-id') tenantId: string) {
    return this.productService.getBulkActionHistory(tenantId);
  }

  @Get('stats')
  async getStats(@Headers('x-tenant-id') tenantId: string) {
    return this.productService.getProductStats(tenantId);
  }

  @Post('import')
  @RequirePermission(Permission.PRODUCT_CREATE)
  async importProducts(
    @Headers('x-tenant-id') tenantId: string,
    @Body() data: { products: any[]; mode: 'create' | 'update' | 'upsert' },
  ) {
    return this.productService.importProducts(
      tenantId,
      data.products,
      data.mode,
    );
  }

  @Get('export')
  async exportProducts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const products = await this.productService.getExportData(tenantId);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=products.json',
      );
      return res.json(products);
    }

    // CSV format (default)
    const csvHeaders = [
      'SKU',
      'Barkod',
      'Ürün Adı',
      'Açıklama',
      'Fiyat',
      'Maliyet',
      'Stok',
      'Kategori',
      'Marka',
      'Durum',
      'Etiketler',
      'Ağırlık (kg)',
    ];
    const csvRows = products.map((p: any) =>
      [
        p.sku,
        p.barcode || '',
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.price,
        p.costPrice || '',
        p.stock,
        p.category || '',
        p.brand || '',
        p.status || 'active',
        (p.tags || []).join('|'),
        p.weight || '',
      ].join(';'),
    );

    const csv = '\uFEFF' + csvHeaders.join(';') + '\n' + csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    return res.send(csv);
  }

  @Get('export/template')
  async getImportTemplate(@Res() res: Response) {
    const csvHeaders = [
      'SKU',
      'Barkod',
      'Ürün Adı',
      'Açıklama',
      'Fiyat',
      'Maliyet',
      'Stok',
      'Kategori',
      'Marka',
      'Durum',
      'Etiketler',
      'Ağırlık (kg)',
    ];
    const exampleRow = [
      'ORNEK-SKU-001',
      '8680001234567',
      'Örnek Ürün Adı',
      'Ürün açıklaması buraya yazılır',
      '199.99',
      '120.00',
      '100',
      'Elektronik',
      'Marka Adı',
      'active',
      'etiket1|etiket2',
      '0.5',
    ];
    const csv = '\uFEFF' + csvHeaders.join(';') + '\n' + exampleRow.join(';');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=urun-sablonu.csv',
    );
    return res.send(csv);
  }

  @Post()
  @RequirePermission(Permission.PRODUCT_CREATE)
  async create(
    @Headers('x-tenant-id') headerTenantId: string,
    @Req() req: any,
    @Body() data: any,
  ) {
    const tenantId = headerTenantId || req.user?.tenantId;
    return this.productService.create(tenantId, data);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  @RequirePermission(Permission.PRODUCT_VIEW)
  async findAll(
    @Headers('x-tenant-id') headerTenantId: string,
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = headerTenantId || req.user?.tenantId;
    return this.productService.findAll(tenantId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  async findOne(
    @Headers('x-tenant-id') headerTenantId: string,
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const tenantId = headerTenantId || req.user?.tenantId;
    return this.productService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermission(Permission.PRODUCT_EDIT)
  async update(
    @Headers('x-tenant-id') headerTenantId: string,
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const tenantId = headerTenantId || req.user?.tenantId;
    return this.productService.update(tenantId, id, data);
  }

  @Delete(':id')
  @RequirePermission(Permission.PRODUCT_DELETE)
  async remove(
    @Headers('x-tenant-id') headerTenantId: string,
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const tenantId = headerTenantId || req.user?.tenantId;
    return this.productService.remove(tenantId, id);
  }
}
