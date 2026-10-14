import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Headers,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { SystemService } from './system.service';
import { SimulationService } from './simulation.service';
import type { SimulationScenario } from './simulation.service';

@Controller('system')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly simulationService: SimulationService,
  ) {}

  @Get('metrics')
  async getMetrics() {
    return this.systemService.getSystemMetrics();
  }

  @Get('services')
  async getServices() {
    return this.systemService.getServiceStatuses();
  }

  @Post('services/:serviceId/:action')
  async controlService(
    @Param('serviceId') serviceId: string,
    @Param('action') action: 'start' | 'stop' | 'restart',
  ) {
    return this.systemService.controlService(serviceId, action);
  }

  @Get('database')
  async getDatabaseInfo() {
    return this.systemService.getDatabaseInfo();
  }

  @Post('database/:action')
  async databaseAction(
    @Param('action') action: 'backup' | 'migrate' | 'optimize',
  ) {
    return this.systemService.databaseAction(action);
  }

  @Get('deployment')
  async getDeploymentInfo() {
    return this.systemService.getDeploymentInfo();
  }

  @Post('scripts/:scriptName/run')
  async runScript(@Param('scriptName') scriptName: string) {
    return this.systemService.runScript(scriptName);
  }

  @Get('stats')
  async getStats() {
    return this.systemService.getPlatformStats();
  }

  @Get('realtime')
  async getRealtimeDashboard() {
    return this.systemService.getRealtimeDashboard();
  }

  @Post('simulate')
  async runSimulation(
    @Headers('x-tenant-id') tenantId: string,
    @Body() scenario: SimulationScenario,
  ) {
    return this.simulationService.runSimulation(
      tenantId || 'default',
      scenario,
    );
  }

  // Security Endpoints
  @Get('security-overview')
  async getSecurityOverview(
    @Headers('x-tenant-id') tenantId: string,
    @Query('tenantId') queryTenantId?: string,
    @Req() req?: any,
  ) {
    const tid = req?.user?.tenantId || queryTenantId || tenantId;
    const uid = req?.user?.id;
    return this.systemService.getSecurityOverview(tid, uid);
  }

  @Get('login-history')
  async getLoginHistory(
    @Headers('x-tenant-id') tenantId: string,
    @Query('tenantId') queryTenantId?: string,
    @Req() req?: any,
  ) {
    const tid = req?.user?.tenantId || queryTenantId || tenantId;
    const uid = req?.user?.id;
    return this.systemService.getLoginHistory(tid, uid);
  }

  @Get('active-sessions')
  async getActiveSessions(
    @Headers('x-tenant-id') tenantId: string,
    @Query('tenantId') queryTenantId?: string,
    @Req() req?: any,
  ) {
    const tid = req?.user?.tenantId || queryTenantId || tenantId;
    const uid = req?.user?.id;
    return this.systemService.getActiveSessions(tid, uid);
  }

  @Get('api-keys')
  async getApiKeys(
    @Headers('x-tenant-id') tenantId: string,
    @Query('tenantId') queryTenantId?: string,
    @Req() req?: any,
  ) {
    const tid = req?.user?.tenantId || queryTenantId || tenantId;
    return this.systemService.getApiKeys(tid);
  }

  @Post('api-keys')
  async createApiKey(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { name?: string; permissions?: string[]; tenantId?: string },
    @Req() req?: any,
  ) {
    const tid = body?.tenantId || req?.user?.tenantId || tenantId;
    const uid = req?.user?.id;
    return this.systemService.createApiKey(tid, uid, body);
  }

  @Delete('api-keys/:id')
  async revokeApiKey(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') keyId: string,
    @Req() req?: any,
  ) {
    const tid = req?.user?.tenantId || tenantId;
    return this.systemService.revokeApiKey(tid, keyId);
  }

  @Delete('sessions/:id')
  async revokeSession(@Param('id') sessionId: string) {
    return this.systemService.revokeSession(sessionId);
  }

  @Post('2fa')
  async toggle2FA(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { enabled?: boolean; tenantId?: string },
    @Req() req?: any,
  ) {
    const tid = body?.tenantId || req?.user?.tenantId || tenantId;
    const uid = req?.user?.id;
    return this.systemService.toggle2FA(tid, uid, Boolean(body?.enabled));
  }
}
