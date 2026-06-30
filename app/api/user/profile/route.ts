import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { requireAuth } from '@/backend/middleware';
import { ProfileSchema } from '@/backend/validators';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const session = authResult.session;
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const result = ProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.flatten() }, { status: 400 });
    }

    const { name, isPublic } = result.data;

    const user = await prisma.user.update({
      where: { id: session.user.id as string },
      data: {
        name: name || undefined,
        isPublic: typeof isPublic === 'boolean' ? isPublic : undefined
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userSafe } = user;

    return NextResponse.json({ user: userSafe });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
