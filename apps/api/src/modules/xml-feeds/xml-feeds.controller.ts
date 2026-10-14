import { XmlJobQueueService } from '../operations/xml-job-queue.service';
import { Controller, Get, Post, Delete, Param, Body, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { XmlFeedsService } from './xml-feeds.service';
import type { XmlFieldMapping } from './xml-product-parser';
@ApiTags('XML Feeds')
@Controller('xml-feeds')
export class XmlFeedsController {
  constructor(private readonly feeds: XmlFeedsService, private readonly jobs: XmlJobQueueService) {}
  private tenant(req: any): string { const id = req.user?.tenantId; if (!id) throw new ForbiddenException('Mağaza oturumu gerekli'); return id; }
  @Get() list(@Req() req: any) { return this.feeds.getFeeds(this.tenant(req)); }
  @Get('products') products(@Req() req: any) { return this.feeds.listProducts(this.tenant(req)); }
  @Post() create(@Req() req: any, @Body() body: { name: string; url: string; markupPercent?: number; fixedFee?: number; autoSync?: boolean; syncInterval?: number }) { return this.feeds.createFeed(this.tenant(req), body); }
  @Post('preview') preview(@Req() req: any, @Body() body: { xml?: string; url?: string; mapping?: XmlFieldMapping }) { return this.feeds.preview(this.tenant(req), body); }
  @Get('jobs') jobsList(@Req() req: any) { return this.jobs.list(this.tenant(req)); }
  @Get('jobs/:id') job(@Req() req: any, @Param('id') id: string) { return this.jobs.get(this.tenant(req), id); }
  @Post('jobs/:id/retry') retry(@Req() req: any, @Param('id') id: string) { return this.jobs.retry(this.tenant(req), id); }
  @Post('import') import(@Req() req: any, @Body() body: { xml?: string; url?: string; mapping?: XmlFieldMapping; markupPercent?: number; fixedFee?: number }) { return this.jobs.enqueue(this.tenant(req), { xml: body.xml, url: body.url, mapping: body.mapping, markupPercent: body.markupPercent, fixedFee: body.fixedFee }, req.headers['idempotency-key']); }
  @Post('export') export(@Req() req: any, @Body() body: { productIds?: string[] }) { return this.feeds.exportXml(this.tenant(req), body.productIds); }
  @Delete(':id') delete(@Req() req: any, @Param('id') id: string) { return this.feeds.deleteFeed(this.tenant(req), id); }
  @Post(':id/sync') sync(@Req() req: any, @Param('id') id: string, @Body() body?: { profitMargin?: number }) { return this.jobs.enqueueFeed(this.tenant(req), id, req.headers['idempotency-key']); }
}
