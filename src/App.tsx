import { useAtom } from 'jotai'
import { TaskList } from './components/task/TaskList'
import { TaskViewer } from './components/task/TaskViewer'
import { filteredTasksAtom, selectedTaskAtom, selectedTaskIdAtom } from './state/tasks'

export default function App() {
  const [tasks] = useAtom(filteredTasksAtom)
  const [selectedTaskId, setSelectedTaskId] = useAtom(selectedTaskIdAtom)
  const [selectedTask] = useAtom(selectedTaskAtom)

  const handleApprove = async (taskId: string) => {
    // TODO: Implement API call
    console.log('Approve task:', taskId)
  }

  const handleReject = async (taskId: string) => {
    // TODO: Implement API call
    console.log('Reject task:', taskId)
  }

  return (
    <div className="w-full min-h-screen flex bg-gray-100">
      <TaskList
        tasks={tasks}
        selectedTask={selectedTaskId}
        onSelectTask={setSelectedTaskId}
      />
      <div className="flex-1 flex">
        {selectedTask ? (
          <TaskViewer
            task={selectedTask}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a task to review
          </div>
        )}
      </div>
    </div>
  )
}