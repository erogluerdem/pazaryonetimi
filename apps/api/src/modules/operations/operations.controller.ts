import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  ForbiddenException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OperationsAlertsService } from './operations-alerts.service';
import { XmlJobQueueService } from './xml-job-queue.service';

@Controller('operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(
    private readonly alerts: OperationsAlertsService,
    private readonly xmlQueue: XmlJobQueueService,
  ) {}

  private user(req: any) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'];
    const userId = req.user?.id || req.user?.sub;
    if (!tenantId) throw new ForbiddenException('Mağaza oturumu gerekli');
    return { tenantId, userId };
  }

  @Get('alerts')
  listAlerts(@Req() req: any) {
    const user = this.user(req);
    return this.alerts.list(user.tenantId, user.userId);
  }

  @Post('alerts/:id/read')
  @HttpCode(HttpStatus.OK)
  readAlert(@Req() req: any, @Param('id') id: string) {
    const user = this.user(req);
    return this.alerts.read(user.tenantId, user.userId, id);
  }

  @Get('jobs')
  listJobs(@Req() req: any) {
    const user = this.user(req);
    return this.xmlQueue.list(user.tenantId);
  }

  @Get('jobs/:id')
  getJob(@Req() req: any, @Param('id') id: string) {
    const user = this.user(req);
    return this.xmlQueue.get(user.tenantId, id);
  }

  @Get('jobs/:id/errors')
  async getJobErrors(@Req() req: any, @Param('id') id: string) {
    const user = this.user(req);
    const job = await this.xmlQueue.get(user.tenantId, id);
    const result = (job.result as Record<string, any>) || {};
    return {
      jobId: id,
      status: job.status,
      failedCount: result.failedCount || 0,
      failedItems: result.failedItems || [],
      error: job.error,
    };
  }

  @Post('jobs/:id/retry')
  @HttpCode(HttpStatus.OK)
  retryJob(@Req() req: any, @Param('id') id: string) {
    const user = this.user(req);
    return this.alerts.retryJob(user.tenantId, id);
  }

  @Post('integrations/:id/retry')
  @HttpCode(HttpStatus.OK)
  retryIntegration(@Req() req: any, @Param('id') id: string) {
    const user = this.user(req);
    return this.alerts.retryIntegrationSync(user.tenantId, id);
  }
}
