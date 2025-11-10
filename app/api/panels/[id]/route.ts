import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db, panels } from '@/db';
import { eq } from 'drizzle-orm';

// GET /api/panels/[id] - Get panel by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      const panel = await db.select()
        .from(panels)
        .where(eq(panels.id, id))
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
      console.error('Error fetching panel:', error);
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

// PUT /api/panels/[id] - Update panel by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { userId, sendToLocations, receiveFromLocations } = body;

      // Validate input
      if (sendToLocations !== undefined && (!Array.isArray(sendToLocations) || sendToLocations.length === 0)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'sendToLocations must be a non-empty array' 
          },
          { status: 400 }
        );
      }

      if (receiveFromLocations !== undefined && (!Array.isArray(receiveFromLocations) || receiveFromLocations.length === 0)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'receiveFromLocations must be a non-empty array' 
          },
          { status: 400 }
        );
      }

      // Build update object
      const updateData: any = {};
      if (userId !== undefined) updateData.userId = userId;
      if (sendToLocations !== undefined) updateData.sendToLocations = sendToLocations;
      if (receiveFromLocations !== undefined) updateData.receiveFromLocations = receiveFromLocations;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'No fields to update' 
          },
          { status: 400 }
        );
      }

      // Update panel
      const updatedPanel = await db.update(panels)
        .set(updateData)
        .where(eq(panels.id, id))
        .returning();

      if (updatedPanel.length === 0) {
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
          panel: updatedPanel[0] 
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Error updating panel:', error);
      
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
          error: 'Failed to update panel' 
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/panels/[id] - Delete panel by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      const deletedPanel = await db.delete(panels)
        .where(eq(panels.id, id))
        .returning();

      if (deletedPanel.length === 0) {
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
          message: 'Panel deleted successfully' 
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting panel:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete panel' 
        },
        { status: 500 }
      );
    }
  });
}


