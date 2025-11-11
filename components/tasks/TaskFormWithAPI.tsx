'use client'

// Alternative: Client Component that uses API routes via hooks
// This version uses the useTasks hook instead of server actions

import { useState } from 'react'
import { useTasks } from '@/hooks'
import { Button } from '../ui/Button'

export function TaskFormWithAPI() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { createTask, error } = useTasks()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      return
    }

    try {
      await createTask(title, description)
      setTitle('')
      setDescription('')
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <h2 className="text-xl font-bold">Create New Task (API)</h2>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title-api" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="title-api"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task title"
        />
      </div>

      <div>
        <label htmlFor="description-api" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description-api"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task description (optional)"
        />
      </div>

      <Button type="submit">Create Task</Button>
    </form>
  )
}




