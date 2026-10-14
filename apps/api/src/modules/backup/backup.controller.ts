import { Controller, Get, Post, Delete, Body, Param, Req, StreamableFile, ForbiddenException } from '@nestjs/common';
import { BackupService } from './backup.service';
@Controller('backup')
export class BackupController {
  constructor(private readonly backup: BackupService) {}
  private user(req: any) { if (!req.user?.tenantId) throw new ForbiddenException('Mağaza oturumu gerekli'); return req.user; }
  @Get('jobs') list(@Req() req: any) { const user = this.user(req); return this.backup.list(user.tenantId, user.type); }
  @Post('create') create(@Req() req: any, @Body() body: { type?: string; name?: string; retentionDays?: number }) { const user = this.user(req); return this.backup.create(user.tenantId, user.type, body.type, body.name, body.retentionDays); }
  @Post('jobs/:id/verify') verify(@Req() req: any, @Param('id') id: string) { const user = this.user(req); return this.backup.verify(user.tenantId, id, user.type); }
  @Post('jobs/:id/test-restore') testRestore(@Req() req: any, @Param('id') id: string) { const user = this.user(req); return this.backup.restoreTest(user.tenantId, id, user.type); }
  @Get('jobs/:id/download') async download(@Req() req: any, @Param('id') id: string) { const user = this.user(req); return new StreamableFile(await this.backup.download(user.tenantId, id, user.type), { type: 'application/octet-stream', disposition: 'attachment; filename="'+id+'.pybackup"' }); }
  @Get('schedules') schedules(@Req() req: any) { return this.backup.schedules(this.user(req).tenantId); }
  @Post('schedules') schedule(@Req() req: any, @Body() body: { type?: string }) { const user = this.user(req); return this.backup.schedule(user.tenantId, user.type, body.type); }
  @Delete('schedules/:id') stop(@Req() req: any, @Param('id') id: string) { return this.backup.stopSchedule(this.user(req).tenantId, id); }
  @Get('restores') restores(@Req() req: any) { return this.backup.restores(this.user(req).tenantId); }
}
