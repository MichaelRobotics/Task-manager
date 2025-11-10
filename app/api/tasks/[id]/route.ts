import { NextRequest, NextResponse } from 'next/server'

// Dynamic API Route Handler
// This file handles HTTP requests to /api/tasks/[id]

// GET /api/tasks/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Your logic here - e.g., fetch task by id from database
    const task = {
      id: parseInt(id),
      title: 'Task',
      completed: false,
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Your logic here - e.g., update task in database
    const updatedTask = {
      id: parseInt(id),
      ...body,
    }

    return NextResponse.json({ task: updatedTask }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Your logic here - e.g., delete task from database

    return NextResponse.json({ message: 'Task deleted' }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}



