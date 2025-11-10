import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db, panels } from '@/db';
import { eq } from 'drizzle-orm';

// GET /api/panels - Get all panels
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const allPanels = await db.select().from(panels);
      
      return NextResponse.json(
        { 
          success: true,
          panels: allPanels 
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error fetching panels:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch panels' 
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/panels - Create a new panel
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { userId, sendToLocations, receiveFromLocations } = body;

      // Validate input
      if (!userId) {
        return NextResponse.json(
          { 
            success: false,
            error: 'userId is required' 
          },
          { status: 400 }
        );
      }

      if (!Array.isArray(sendToLocations) || sendToLocations.length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'sendToLocations must be a non-empty array' 
          },
          { status: 400 }
        );
      }

      if (!Array.isArray(receiveFromLocations) || receiveFromLocations.length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'receiveFromLocations must be a non-empty array' 
          },
          { status: 400 }
        );
      }

      // Generate panel ID
      const panelId = `panel-${Date.now()}`;

      // Create panel in database
      const newPanel = await db.insert(panels).values({
        id: panelId,
        userId,
        sendToLocations,
        receiveFromLocations,
      }).returning();

      return NextResponse.json(
        { 
          success: true,
          panel: newPanel[0] 
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Error creating panel:', error);
      
      // Handle unique constraint violation (duplicate userId)
      if (error.code === '23505' || error.message?.includes('unique')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Panel with this userId already exists' 
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create panel' 
        },
        { status: 500 }
      );
    }
  });
}


