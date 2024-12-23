import { Task } from '../../types/task'

interface TaskListProps {
  tasks: Task[]
  selectedTask: string | null
  onSelectTask: (id: string) => void
}

export function TaskList({ tasks, selectedTask, onSelectTask }: TaskListProps) {
  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onSelectTask(task.id)}
            className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-50
              ${selectedTask === task.id ? 'bg-gray-100' : ''}`}
          >
            <div className="font-medium text-gray-900 truncate">{task.title}</div>
            <div className="flex justify-between text-sm text-gray-500">
              <span className="truncate">{task.type}</span>
              <span>{task.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}