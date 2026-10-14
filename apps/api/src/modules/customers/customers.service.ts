import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CustomerFilters {
  tenantId: string;
  status?: 'vip' | 'regular' | 'new' | 'at-risk' | 'inactive';
  search?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: CustomerFilters) {
    const {
      tenantId,
      status,
      search,
      sortBy = 'totalSpent',
      page = 1,
      limit = 20,
    } = filters;

    // Fetch orders to aggregate customer data
    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        customerEmail: true,
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        orderDate: true,
        platform: true,
      },
      orderBy: { orderDate: 'desc' },
    });

    const customerMap = new Map<string, any>();

    for (const order of orders) {
      const email = order.customerEmail || 'unknown@customer.com';
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: email.replace(/[^a-zA-Z0-9]/g, ''),
          name: order.customerName || 'Bilinmeyen Müşteri',
          email,
          phone: order.customerPhone || '',
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: order.orderDate,
          platforms: new Set<string>(),
          joinDate: order.orderDate,
        });
      }

      const c = customerMap.get(email);
      c.totalOrders += 1;
      c.totalSpent += Number(order.totalAmount);
      c.platforms.add(order.platform);

      const orderDate = new Date(order.orderDate);
      if (orderDate > new Date(c.lastOrderDate)) {
        c.lastOrderDate = order.orderDate;
      }
      if (orderDate < new Date(c.joinDate)) {
        c.joinDate = order.orderDate;
      }
    }

    const now = new Date();
    let customersList = Array.from(customerMap.values()).map((c) => {
      const recency = Math.floor(
        (now.getTime() - new Date(c.lastOrderDate).getTime()) / 86400000,
      );
      const avgOrderValue = c.totalSpent / c.totalOrders;

      // Basic RFM mapping for status
      let segment: 'vip' | 'regular' | 'new' | 'at-risk' | 'inactive' =
        'regular';
      if (c.totalSpent > 10000 || c.totalOrders > 10) segment = 'vip';
      else if (recency < 30 && c.totalOrders === 1) segment = 'new';
      else if (recency > 90) segment = 'at-risk';
      else if (recency > 180) segment = 'inactive';

      return {
        ...c,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        totalSpent: Math.round(c.totalSpent * 100) / 100,
        status: segment,
        segment,
        platforms: Array.from(c.platforms),
        loyaltyScore: Math.round(
          ((this.calculateRecencyScore(recency) +
            this.calculateFrequencyScore(c.totalOrders) +
            this.calculateMonetaryScore(c.totalSpent)) /
            15) *
            100,
        ),
      };
    });

    // Filter by status if requested
    if (status) {
      customersList = customersList.filter((c) => c.status === status);
    }

    // Sort
    customersList.sort((a, b) => {
      if (sortBy === 'totalSpent') return b.totalSpent - a.totalSpent;
      if (sortBy === 'totalOrders') return b.totalOrders - a.totalOrders;
      if (sortBy === 'lastOrder')
        return (
          new Date(b.lastOrderDate).getTime() -
          new Date(a.lastOrderDate).getTime()
        );
      return 0;
    });

    const total = customersList.length;
    const skip = (page - 1) * limit;
    const paginatedCustomers = customersList.slice(skip, skip + limit);

    return {
      customers: paginatedCustomers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    // In a real app, 'id' would be unique. Here we use sanitized email.
    // We'll search by orders that match a customer name/email that produces this ID.
    const orders = await this.prisma.order.findMany({
      where: { tenantId },
      select: {
        customerEmail: true,
        customerName: true,
        customerPhone: true,
        shippingAddress: true,
        billingAddress: true,
        totalAmount: true,
        orderDate: true,
        platform: true,
        id: true,
        status: true,
      },
      orderBy: { orderDate: 'desc' },
    });

    // Find the customer that matches the ID
    const customerOrders = orders.filter((o) => {
      const email = o.customerEmail || 'unknown@customer.com';
      return email.replace(/[^a-zA-Z0-9]/g, '') === id;
    });

    if (customerOrders.length === 0) return null;

    const latestOrder = customerOrders[0];
    const totalSpent = customerOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    const avgOrderValue = totalSpent / customerOrders.length;
    const now = new Date();
    const recency = Math.floor(
      (now.getTime() - new Date(latestOrder.orderDate).getTime()) / 86400000,
    );

    return {
      id,
      name: latestOrder.customerName || 'Bilinmeyen Müşteri',
      email: latestOrder.customerEmail,
      phone: latestOrder.customerPhone,
      address: latestOrder.shippingAddress,
      totalOrders: customerOrders.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageOrder: Math.round(avgOrderValue * 100) / 100,
      lastOrderDate: latestOrder.orderDate,
      loyaltyScore: Math.round(
        ((this.calculateRecencyScore(recency) +
          this.calculateFrequencyScore(customerOrders.length) +
          this.calculateMonetaryScore(totalSpent)) /
          15) *
          100,
      ),
      platforms: Array.from(new Set(customerOrders.map((o) => o.platform))),
      recentOrders: customerOrders.slice(0, 5).map((o) => ({
        id: o.id,
        date: o.orderDate,
        amount: Number(o.totalAmount),
        status: o.status,
      })),
      notes: [], // These would need a separate model
    };
  }

  async getStats(tenantId: string) {
    const orders = await this.prisma.order.findMany({
      where: { tenantId },
      select: {
        customerEmail: true,
        totalAmount: true,
        orderDate: true,
      },
    });

    if (orders.length === 0) {
      return {
        total: 0,
        totalCustomers: 0,
        vip: 0,
        vipCustomers: 0,
        regular: 0,
        regularCustomers: 0,
        new: 0,
        newCustomersThisMonth: 0,
        atRisk: 0,
        atRiskCustomers: 0,
        inactive: 0,
        inactiveCustomers: 0,
        totalRevenue: 0,
        avgLifetimeValue: 0,
        averageLifetimeValue: 0,
        averageOrderValue: 0,
        retentionRate: 0,
        churnRate: 0,
        customerGrowth: 0,
        growth: { thisMonth: 0, lastMonth: 0 },
        topCities: [],
      };
    }

    const customerMap = new Map<string, any>();
    let totalRevenue = 0;

    for (const order of orders) {
      const email = order.customerEmail || 'unknown';
      totalRevenue += Number(order.totalAmount);
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          orders: 0,
          spent: 0,
          firstDate: order.orderDate,
          lastDate: order.orderDate,
        });
      }
      const c = customerMap.get(email);
      c.orders += 1;
      c.spent += Number(order.totalAmount);

      const orderDate = new Date(order.orderDate);
      if (orderDate > new Date(c.lastDate)) c.lastDate = order.orderDate;
      if (orderDate < new Date(c.firstDate)) c.firstDate = order.orderDate;
    }

    const total = customerMap.size;
    let vip = 0,
      regular = 0,
      newCust = 0,
      atRisk = 0,
      inactive = 0;
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const c of customerMap.values()) {
      const recency = Math.floor(
        (now.getTime() - new Date(c.lastDate).getTime()) / 86400000,
      );

      if (new Date(c.firstDate) >= firstOfMonth) newCust++;

      if (c.spent > 10000 || c.orders > 10) vip++;
      else if (recency > 90) atRisk++;
      else if (recency > 180) inactive++;
      else regular++;
    }

    return {
      totalCustomers: total,
      vipCustomers: vip,
      regularCustomers: regular,
      newCustomersThisMonth: newCust,
      atRiskCustomers: atRisk,
      inactiveCustomers: inactive,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgLifetimeValue: Math.round((totalRevenue / total) * 100) / 100,
      averageOrderValue: Math.round((totalRevenue / orders.length) * 100) / 100,
      retentionRate: Math.round((total / orders.length) * 1000) / 10,
      churnRate: 0,
      customerGrowth: 0,
      growth: {
        thisMonth: 0,
        lastMonth: 0,
      },
      topCities: [],
    };
  }

  async addTag(customerId: string, tenantId: string, tag: string) {
    return { success: true, customerId, tag };
  }

  async removeTag(customerId: string, tenantId: string, tag: string) {
    return { success: true, customerId, tag };
  }

  async addNote(customerId: string, tenantId: string, note: string) {
    return {
      id: Date.now(),
      customerId,
      text: note,
      createdAt: new Date(),
    };
  }

  async getSegments(tenantId: string) {
    const stats = await this.getStats(tenantId);
    return [
      {
        id: 'seg-1',
        name: 'VIP Müşteriler',
        description: 'En değerli müşterileriniz',
        count: stats.vipCustomers,
        criteria: { totalSpent: { gte: 10000 } },
      },
      {
        id: 'seg-2',
        name: 'Sadık Müşteriler',
        description: 'Düzenli alışveriş yapanlar',
        count: stats.regularCustomers,
        criteria: { totalOrders: { gte: 5 } },
      },
      {
        id: 'seg-3',
        name: 'Risk Grubu',
        description: 'Uzaklaşmaya başlayanlar',
        count: stats.atRiskCustomers,
        criteria: { lastOrderDaysAgo: { gte: 90 } },
      },
    ];
  }
  private calculateRecencyScore(days: number): number {
    if (days <= 7) return 5;
    if (days <= 30) return 4;
    if (days <= 90) return 3;
    if (days <= 180) return 2;
    return 1;
  }

  private calculateFrequencyScore(count: number): number {
    if (count >= 10) return 5;
    if (count >= 5) return 4;
    if (count >= 3) return 3;
    if (count >= 2) return 2;
    return 1;
  }

  private calculateMonetaryScore(amount: number): number {
    if (amount >= 10000) return 5;
    if (amount >= 5000) return 4;
    if (amount >= 2000) return 3;
    if (amount >= 500) return 2;
    return 1;
  }
}
