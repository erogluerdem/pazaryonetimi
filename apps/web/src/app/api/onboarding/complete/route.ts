export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const completedSteps = body.completedSteps || ['welcome', 'profile', 'tenant', 'platforms', 'tour', 'complete'];
    const totalTimeSpent = body.totalTimeSpent || 0;

    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        currentStep: 'COMPLETE',
        completedSteps,
        isActive: false,
        isCompleted: true,
        completionDate: new Date(),
        totalTimeSpent,
      },
      update: {
        isCompleted: true,
        isActive: false,
        completionDate: new Date(),
        completedSteps,
        totalTimeSpent,
        currentStep: 'COMPLETE',
      },
    });

    const user = session.user as any;
    if (user.tenantId) {
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { isOnboarded: true },
      }).catch(() => undefined);
    }

    return NextResponse.json({ success: true, onboarding });
  } catch (error) {
    console.error('Error completing onboarding via /complete:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 },
    );
  }
}
