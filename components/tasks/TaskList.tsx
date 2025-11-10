'use client'

// Client Component that uses the useTasks hook
// This component fetches and displays tasks using the API

import { useTasks } from '@/hooks'
import { TaskItem } from './TaskItem'
import { Button } from '../ui/Button'

export function TaskList() {
  const { tasks, loading, error, fetchTasks } = useTasks()

  if (loading) {
    return <div className="p-4">Loading tasks...</div>
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={fetchTasks} variant="secondary" className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <Button onClick={fetchTasks} variant="secondary" size="sm">
          Refresh
        </Button>
      </div>
      
      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks found. Create one to get started!</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  )
}



