import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { hashPassword } from '@/backend/auth-utils';
import { SignUpSchema } from '@/backend/validators';
import { checkRateLimit, RATE_LIMITS } from '@/backend/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    // safeParse avoids throwing, easier for custom error response
    const result = SignUpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Check rate limit (Using Database)
    // Use AUTH_STRICT limits (5 attempts per 15 mins)
    const isLimited = await checkRateLimit(`signup:${ip}:${email}`, RATE_LIMITS.AUTH_STRICT.max, RATE_LIMITS.AUTH_STRICT.window);

    if (isLimited) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // Don't reveal user existence? Or generic error?
      // For UX, we reveal it here, but strict security might genericize. 
      // Keeping consistent with previous behavior.
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Relations default to empty
      }
    });

    // Return success response (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
