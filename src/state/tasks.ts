import { atom } from 'jotai'
import { Task } from '../types/task'
import { dummyTasks } from '../lib/dummyTasks'

// Initialize with dummy tasks
export const tasksAtom = atom<Task[]>(dummyTasks)
export const selectedTaskIdAtom = atom<string | null>(null)

export const selectedTaskAtom = atom((get) => {
  const tasks = get(tasksAtom)
  const selectedId = get(selectedTaskIdAtom)
  return tasks.find(task => task.id === selectedId) || null
})

// Filter and search atoms
export const searchQueryAtom = atom('')
export const filteredTasksAtom = atom((get) => {
  const tasks = get(tasksAtom)
  const query = get(searchQueryAtom).toLowerCase()

  if (!query) return tasks

  return tasks.filter(task =>
    task.title.toLowerCase().includes(query) ||
    task.description.toLowerCase().includes(query)
  )
})