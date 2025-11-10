import { NextRequest, NextResponse } from 'next/server'

// Example API Route Handler
// This file handles HTTP requests to /api/tasks
// Supports: GET, POST, PUT, DELETE, etc.

// GET /api/tasks
export async function GET(request: NextRequest) {
  try {
    // Your logic here - e.g., fetch from database
    const tasks = [
      { id: 1, title: 'Task 1', completed: false },
      { id: 2, title: 'Task 2', completed: true },
    ]

    return NextResponse.json({ tasks }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description } = body

    // Validate input
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Your logic here - e.g., save to database
    const newTask = {
      id: Date.now(),
      title,
      description,
      completed: false,
    }

    return NextResponse.json({ task: newTask }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}



