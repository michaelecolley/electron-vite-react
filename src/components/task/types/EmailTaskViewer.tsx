import { EmailTask } from '../../../types/emailTask'
import { format } from 'date-fns'

interface EmailTaskViewerProps {
  task: EmailTask
}

export function EmailTaskViewer({ task }: EmailTaskViewerProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">From</p>
              <p className="font-medium">{task.metadata.from}</p>
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(task.createdAt), 'PPpp')}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">To</p>
            <p className="font-medium">{task.metadata.to.join(', ')}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Subject</p>
            <p className="font-medium">{task.metadata.subject}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: task.metadata.content }} />
      </div>

      {task.metadata.attachments && task.metadata.attachments.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-medium mb-4">Attachments</h3>
          <div className="space-y-2">
            {task.metadata.attachments.map((attachment) => (
              <div key={attachment.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">{attachment.name}</span>
                <span className="text-sm text-gray-500">
                  {(attachment.size / 1024).toFixed(2)} KB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}