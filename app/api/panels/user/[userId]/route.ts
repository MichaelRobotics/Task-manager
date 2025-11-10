import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db, panels } from '@/db';
import { eq } from 'drizzle-orm';

// GET /api/panels/user/[userId] - Get panel by userId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { userId } = await params;

      const panel = await db.select()
        .from(panels)
        .where(eq(panels.userId, userId))
        .limit(1);

      if (panel.length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Panel not found' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          success: true,
          panel: panel[0] 
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error fetching panel by userId:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch panel' 
        },
        { status: 500 }
      );
    }
  });
}


