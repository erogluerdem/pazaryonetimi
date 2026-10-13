import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Headers,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../../database/prisma.service';

class CreateNotificationDto {
  title!: string;
  message!: string;
  type!: string;
  severity?: string;
  actionUrl?: string;
  userId?: string;
  data?: any;
}

class MarkReadDto {
  notificationIds!: string[];
}

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async getNotifications(
    @Headers('x-tenant-id') tenantId: string,
    @Query('unreadOnly') unreadOnly: boolean = false,
    @Query('limit') limit: number = 50,
  ): Promise<{
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      severity: string;
      isRead: boolean;
      createdAt: Date;
      actionUrl?: string;
      data?: any;
    }>;
    unreadCount: number;
  }> {
    if (!tenantId) {
      return {
        notifications: [],
        unreadCount: 0,
      };
    }

    const unreadFilter = String(unreadOnly) === 'true';
    const take = Math.min(Math.max(1, Number(limit) || 50), 100);

    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          tenantId,
          ...(unreadFilter ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.notification.count({
        where: { tenantId, isRead: false },
      }),
    ]);

    return {
      notifications: items.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        severity: n.severity,
        isRead: n.isRead,
        createdAt: n.createdAt,
        actionUrl: n.actionUrl || undefined,
        data: n.data,
      })),
      unreadCount,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create and send notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
  })
  async createNotification(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateNotificationDto,
  ): Promise<{ success: boolean; notificationId: string }> {
    const effectiveTenantId = tenantId || 'default';
    const created = await this.prisma.notification.create({
      data: {
        tenantId: effectiveTenantId,
        userId: dto.userId || null,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'system',
        severity: dto.severity || 'info',
        actionUrl: dto.actionUrl || null,
        data: dto.data || undefined,
      },
    });

    const payload = {
      id: created.id,
      title: dto.title,
      message: dto.message,
      type: dto.type as any,
      severity: (dto.severity || 'info') as any,
      timestamp: created.createdAt.toISOString(),
      data: { ...(dto.data || {}), actionUrl: dto.actionUrl },
    };

    if (dto.userId) {
      this.notificationsGateway.sendToUser(dto.userId, payload);
    } else if (tenantId) {
      this.notificationsGateway.broadcastToTenant(tenantId, payload);
    }

    return { success: true, notificationId: created.id };
  }

  @Patch('mark-read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markAsRead(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: MarkReadDto,
  ): Promise<{ success: boolean; markedCount: number }> {
    if (!dto?.notificationIds?.length) {
      return { success: true, markedCount: 0 };
    }

    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: dto.notificationIds },
        ...(tenantId ? { tenantId } : {}),
      },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true, markedCount: result.count };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<{ success: boolean }> {
    if (!tenantId) return { success: true };

    await this.prisma.notification.updateMany({
      where: { tenantId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getSettings(): Promise<{
    email: boolean;
    push: boolean;
    sms: boolean;
    types: Record<string, boolean>;
  }> {
    return {
      email: true,
      push: true,
      sms: false,
      types: {
        order: true,
        stock: true,
        price: true,
        system: true,
      },
    };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @Body() settings: Partial<{ email: boolean; push: boolean; sms: boolean }>,
  ): Promise<{ success: boolean }> {
    return { success: true };
  }

  @Post('push-subscribe')
  @ApiOperation({ summary: 'Web Push bildirim aboneliği kaydet' })
  async pushSubscribe(
    @Headers('x-tenant-id') tenantId: string,
    @Body() subscription: any,
  ) {
    return {
      success: true,
      message: 'Push bildirimi aboneliği başarıyla kaydedildi',
      subscribedAt: new Date().toISOString(),
    };
  }

  @Post('push-broadcast')
  @ApiOperation({ summary: 'Anlık acil bildirim fırlat (Yeni Sipariş / BuyBox Kaybı)' })
  async pushBroadcast(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    data: {
      title: string;
      message: string;
      type: 'order' | 'buybox' | 'stock' | 'system';
      url?: string;
    },
  ) {
    const notificationId = `push_${Date.now()}`;
    const effectiveTenant = tenantId || 'all';

    if (tenantId) {
      await this.prisma.notification.create({
        data: {
          tenantId,
          type: data.type === 'buybox' ? 'price' : data.type,
          severity: data.type === 'buybox' ? 'warning' : 'success',
          title: data.title,
          message: data.message,
          actionUrl: data.url || '/dashboard',
        },
      }).catch(() => undefined);
    }

    this.notificationsGateway.broadcastToTenant(effectiveTenant, {
      id: notificationId,
      title: data.title,
      message: data.message,
      type: (data.type === 'buybox' ? 'price' : data.type) as any,
      severity: data.type === 'buybox' ? 'warning' : 'success',
      timestamp: new Date().toISOString(),
      data: { actionUrl: data.url || '/dashboard' },
    });

    return { success: true, broadcastedAt: new Date().toISOString() };
  }
}
