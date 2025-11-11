'use server'

// Server Actions for tasks
// These functions run on the server and can be called directly from client components
// No need for API routes when using server actions

interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
}

// Create a new task
export async function createTask(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null

  // Validate input
  if (!title) {
    return { error: 'Title is required' }
  }

  try {
    // Your server-side logic here - e.g., save to database
    const newTask: Task = {
      id: Date.now(),
      title,
      description: description || undefined,
      completed: false,
    }

    // Revalidate cache if needed
    // revalidatePath('/tasks')

    return { success: true, task: newTask }
  } catch (error) {
    return { error: 'Failed to create task' }
  }
}

// Update an existing task
export async function updateTask(taskId: number, formData: FormData) {
  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null
  const completed = formData.get('completed') === 'true'

  try {
    // Your server-side logic here - e.g., update in database
    const updatedTask: Task = {
      id: taskId,
      title: title || '',
      description: description || undefined,
      completed,
    }

    // Revalidate cache if needed
    // revalidatePath('/tasks')
    // revalidatePath(`/tasks/${taskId}`)

    return { success: true, task: updatedTask }
  } catch (error) {
    return { error: 'Failed to update task' }
  }
}

// Delete a task
export async function deleteTask(taskId: number) {
  try {
    // Your server-side logic here - e.g., delete from database

    // Revalidate cache if needed
    // revalidatePath('/tasks')

    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete task' }
  }
}

// Get all tasks (can be used in Server Components)
export async function getTasks(): Promise<Task[]> {
  try {
    // Your server-side logic here - e.g., fetch from database
    return [
      { id: 1, title: 'Task 1', completed: false },
      { id: 2, title: 'Task 2', completed: true },
    ]
  } catch (error) {
    throw new Error('Failed to fetch tasks')
  }
}




