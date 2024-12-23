import { Task } from '../../types/task'
import { EmailTask } from '../../types/emailTask'
import { EmailTaskViewer } from './types/EmailTaskViewer'

interface TaskViewerProps {
  task: Task
  onApprove: (taskId: string) => void
  onReject: (taskId: string) => void
}

export function TaskViewer({ task, onApprove, onReject }: TaskViewerProps) {
  const renderTaskContent = () => {
    switch (task.type) {
      case 'email':
        return <EmailTaskViewer task={task as EmailTask} />
      default:
        return (
          <div className="prose max-w-none">
            <p>{task.description}</p>
          </div>
        )
    }
  }

  return (
    <div className="flex-1 h-screen flex flex-col max-w-4xl mx-auto w-full">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
        <div className="space-x-2">
          <button
            onClick={() => onReject(task.id)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(task.id)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Approve
          </button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {renderTaskContent()}
      </div>
    </div>
  )
}