# Project Structure

This document explains the file structure for this Next.js application.

## Directory Structure

```
task_manager/
├── app/                    # Next.js App Router directory
│   ├── api/               # API Route Handlers
│   │   └── tasks/
│   │       ├── route.ts   # GET, POST /api/tasks
│   │       └── [id]/
│   │           └── route.ts  # GET, PUT, DELETE /api/tasks/[id]
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React Components
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx    # Button component
│   │   └── index.ts      # Export UI components
│   ├── tasks/            # Task-related components
│   │   ├── TaskList.tsx  # List of tasks (uses hooks)
│   │   ├── TaskItem.tsx  # Individual task item
│   │   ├── TaskForm.tsx  # Form using server actions
│   │   ├── TaskFormWithAPI.tsx  # Form using API routes
│   │   └── index.ts      # Export task components
│   └── index.ts          # Export all components
├── hooks/                 # Custom React Hooks
│   ├── useTasks.ts        # Hook for API calls to /api/tasks
│   └── index.ts           # Export all hooks
├── actions/               # Server Actions
│   ├── tasks.ts           # Server actions for tasks
│   └── index.ts           # Export all actions
└── ...
```

## API Routes (`app/api/`)

API routes are defined using **Route Handlers** in the `app/api/` directory.

### Structure
- Each route is a `route.ts` (or `route.js`) file
- Export HTTP method functions: `GET`, `POST`, `PUT`, `DELETE`, etc.
- Dynamic routes use `[param]` folder names

### Example
```typescript
// app/api/tasks/route.ts
export async function GET(request: NextRequest) {
  return NextResponse.json({ tasks: [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // ... handle POST
  return NextResponse.json({ task: newTask }, { status: 201 })
}
```

### Usage
- Accessible at `/api/tasks`
- Can be called from client components, server components, or external services
- Use `NextRequest` and `NextResponse` from `next/server`

## Hooks (`hooks/`)

Custom React hooks for making API calls from client components.

### Structure
- Each hook is a separate file (e.g., `useTasks.ts`)
- Must have `'use client'` directive
- Export from `hooks/index.ts` for easy imports

### Example
```typescript
// hooks/useTasks.ts
'use client'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  
  const fetchTasks = async () => {
    const response = await fetch('/api/tasks')
    const data = await response.json()
    setTasks(data.tasks)
  }
  
  return { tasks, fetchTasks }
}
```

### Usage
```typescript
'use client'
import { useTasks } from '@/hooks'

export function TaskList() {
  const { tasks, loading } = useTasks()
  // ...
}
```

## Server Actions (`actions/`)

Server actions run on the server and can be called directly from client components.

### Structure
- Each file has `'use server'` directive at the top
- Functions are async and can accept `FormData` or other parameters
- Export from `actions/index.ts` for easy imports

### Example
```typescript
// actions/tasks.ts
'use server'

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string
  // ... server-side logic
  return { success: true, task: newTask }
}
```

### Usage

**In Forms:**
```typescript
import { createTask } from '@/actions'

export function TaskForm() {
  return (
    <form action={createTask}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

**In Client Components:**
```typescript
'use client'
import { createTask } from '@/actions'

export function Button() {
  return (
    <button onClick={async () => {
      const formData = new FormData()
      formData.set('title', 'New Task')
      await createTask(formData)
    }}>
      Create Task
    </button>
  )
}
```

## When to Use What?

### Use API Routes (`app/api/`) when:
- You need a RESTful API endpoint
- External services need to call your API
- You need fine-grained control over HTTP methods and status codes
- You're building a public API

### Use Server Actions (`actions/`) when:
- You're working with forms
- You want simpler data mutations without API boilerplate
- You need server-side validation and processing
- You want automatic revalidation of cached data
- You prefer direct function calls over HTTP requests

### Use Hooks (`hooks/`) when:
- You need to call API routes from client components
- You want to manage loading states, error handling, and data fetching
- You need reactive data that updates in the UI
- You're building interactive client-side features

## Components (`components/`)

React components for building the user interface. Components can be either **Server Components** (default) or **Client Components** (with `'use client'` directive).

### Structure
- `components/ui/` - Reusable UI components (buttons, inputs, etc.)
- `components/[feature]/` - Feature-specific components
- Each component directory has an `index.ts` for exports
- Main `components/index.ts` exports everything

### Server Components (Default)
- Run on the server
- Cannot use hooks, state, or browser APIs
- Can directly import and use server actions
- Great for static content and data fetching

### Client Components
- Must have `'use client'` directive at the top
- Can use hooks, state, event handlers
- Can call API routes via hooks or use server actions
- Required for interactivity

### Example: Server Component
```typescript
// components/tasks/TaskDisplay.tsx
import { getTasks } from '@/actions'

export async function TaskDisplay() {
  const tasks = await getTasks()
  
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

### Example: Client Component with Hooks
```typescript
// components/tasks/TaskList.tsx
'use client'

import { useTasks } from '@/hooks'

export function TaskList() {
  const { tasks, loading } = useTasks()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

### Example: Client Component with Server Actions
```typescript
// components/tasks/TaskForm.tsx
'use client'

import { createTask } from '@/actions'

export function TaskForm() {
  return (
    <form action={createTask}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Usage
```typescript
// In app/page.tsx or other components
import { TaskList, TaskForm } from '@/components'

export default function Page() {
  return (
    <div>
      <TaskForm />
      <TaskList />
    </div>
  )
}
```

## Best Practices

1. **API Routes**: Keep them focused on HTTP concerns (request/response handling)
2. **Server Actions**: Keep them focused on data mutations and server-side logic
3. **Hooks**: Keep them focused on client-side state management and API interactions
4. **Components**: 
   - Use Server Components by default (no `'use client'`)
   - Only add `'use client'` when you need interactivity, hooks, or browser APIs
   - Organize by feature in subdirectories
   - Keep UI components reusable and generic
5. **Type Safety**: Use TypeScript for all files
6. **Error Handling**: Always handle errors gracefully in all patterns
7. **Validation**: Validate input in both API routes and server actions

