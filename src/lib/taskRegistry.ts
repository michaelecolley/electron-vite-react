import { TaskType } from '../types/task'

const taskTypes = new Map<string, TaskType>()

export function registerTaskType(type: TaskType) {
  taskTypes.set(type.id, type)
}

export function getTaskType(id: string): TaskType | undefined {
  return taskTypes.get(id)
}

export function getAllTaskTypes(): TaskType[] {
  return Array.from(taskTypes.values())
}