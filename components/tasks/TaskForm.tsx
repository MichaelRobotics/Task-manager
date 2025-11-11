'use client'

// Client Component that uses Server Actions
// This form submits data using server actions instead of API routes

import { useState } from 'react'
import { createTask } from '@/actions'
import { Button } from '../ui/Button'

export function TaskForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createTask(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        // Reset form on success
        const form = document.getElementById('task-form') as HTMLFormElement
        form?.reset()
        // Optionally refresh the page or update the task list
        window.location.reload()
      }
    } catch (err) {
      setError('Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form id="task-form" action={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <h2 className="text-xl font-bold">Create New Task</h2>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task title"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task description (optional)"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Task'}
      </Button>
    </form>
  )
}




