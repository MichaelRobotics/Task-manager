'use client'

// Client Component for individual task items
// Uses hooks to interact with the API

import { useTasks } from '@/hooks'
import { Button } from '../ui/Button'

interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
}

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const { updateTask, deleteTask } = useTasks()

  const handleToggle = async () => {
    try {
      await updateTask(task.id, { completed: !task.completed })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(task.id)
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    }
  }

  return (
    <li className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
        className="mt-1 w-5 h-5 cursor-pointer"
      />
      <div className="flex-1">
        <h3
          className={`font-medium ${
            task.completed ? 'line-through text-gray-500' : 'text-gray-900'
          }`}
        >
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        )}
      </div>
      <Button
        onClick={handleDelete}
        variant="danger"
        size="sm"
        type="button"
      >
        Delete
      </Button>
    </li>
  )
}




