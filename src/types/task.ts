interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  type: string
  metadata: Record<string, any>
}

interface TaskType {
  id: string
  name: string
  component: string
  description: string
}

export type { Task, TaskType }