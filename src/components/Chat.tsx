import { useState, useEffect, useRef, useMemo } from 'react'
import { TimeAnalysisService } from '../services/analysis/TimeAnalysisService'
import { NotionCalendarService } from '../services/notion/NotionCalendarService'
import { NotionBubble } from './NotionBubble'
import { v4 as uuidv4 } from 'uuid'

interface NotionPage {
  id?: string
  properties: Record<string, any>
  isNew?: boolean
}

interface Message {
  id: string
  text: string
  sent: boolean
  notionData?: NotionPage
  isEditing?: boolean
}

interface Command {
  name: string
  description: string
  action: (text?: string) => Promise<void> | void
}

interface TaskCommandParams {
  command: string
  status: string
}

function parseTaskCommand(message: string): TaskCommandParams | null {
  const taskRegex = /^\/tasks\s+(.+)$/i
  const match = message.trim().match(taskRegex)

  if (match) {
    return {
      command: 'tasks',
      status: match[1].trim()
    }
  }
  return null
}

function formatTaskList(tasks: any[]): string {
  if (tasks.length === 0) {
    return 'No tasks found with that status.'
  }

  return tasks.map(task => {
    const title = task.properties.Name?.title[0]?.plain_text || 'Untitled'
    const dueDate = task.properties.Date?.date?.start
      ? `(Due: ${new Date(task.properties.Date.date.start).toLocaleDateString()})`
      : ''

    return `• ${title} ${dueDate}`
  }).join('\n')
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isDark, setIsDark] = useState(true) // Default to dark mode
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showCommands, setShowCommands] = useState(false)
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([])
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)

  // Initialize services
  const calendarService = useMemo(() => new NotionCalendarService(), [])
  const timeAnalysis = useMemo(
    () => new TimeAnalysisService(calendarService),
    [calendarService]
  )

  const commands = useMemo(() => [
    {
      name: '/clear',
      description: 'Clear the message thread',
      action: () => {
        setMessages([])
      }
    },
    {
      name: '/list',
      description: 'Show all available commands',
      action: () => {
        const commandList = commands
          .map(cmd => `• ${cmd.name}\n    ${cmd.description}`)
          .join('\n\n')

        setMessages(prev => [...prev, {
          id: uuidv4(),
          text: `📋 Available Commands:\n\n${commandList}`,
          sent: false
        }])
      }
    },
    {
      name: '/dark',
      description: 'Switch to dark mode',
      action: () => {
        setIsDark(true)
        document.documentElement.classList.add('dark')
      }
    },
    {
      name: '/light',
      description: 'Switch to light mode',
      action: () => {
        setIsDark(false)
        document.documentElement.classList.remove('dark')
      }
    },
    {
      name: '/freetime',
      description: 'Show free time analysis for next week',
      action: async () => {
        setIsAnalyzing(true)
        try {
          const analysis = await timeAnalysis.getWeeklyFreeTime()
          const formattedAnalysis = timeAnalysis.formatWeeklyFreeTime(analysis)
          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: `Free time for next week:\n${formattedAnalysis}`,
            sent: false
          }])
        } catch (error) {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: `Error analyzing free time: ${error.message}`,
            sent: false
          }])
        } finally {
          setIsAnalyzing(false)
        }
      }
    },
    {
      name: '/test-notion',
      description: 'Test Notion API connection and show database schema',
      action: async () => {
        try {
          const response = await window.ipcRenderer.invoke('test-notion-connection')
          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: `Notion Database Schema:\n${JSON.stringify(response.properties, null, 2)}`,
            sent: false
          }])
        } catch (error) {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: `Error testing Notion connection: ${error.message}`,
            sent: false
          }])
        }
      }
    },
    {
      name: '/tasks',
      description: 'List tasks by status (e.g., /tasks today)',
      action: async () => {
        const taskParams = parseTaskCommand(newMessage)
        if (!taskParams) {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: 'Invalid task command. Use format: /tasks <status>',
            sent: false
          }])
          return
        }

        try {
          const tasks = await window.ipcRenderer.invoke(
            'query-tasks-by-status',
            taskParams.status
          )

          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: `Tasks with status "${taskParams.status}":\n${formatTaskList(tasks)}`,
            sent: false
          }])
        } catch (error: any) {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: `Error fetching tasks: ${error.message}`,
            sent: false
          }])
        }
      }
    },
    {
      name: '/new',
      description: 'Create a new entry with optional title (e.g., /new do the laundry)',
      action: async (text?: string) => {
        console.log('Executing /new command with text:', text)
        try {
          // Extract the title from the command
          const title = text?.replace('/new', '').trim()

          if (title) {
            // If we have a title, create the entry directly without showing the bubble
            const newEntry = {
              properties: {
                Name: {
                  type: 'title',
                  title: [{
                    type: 'text',
                    text: {
                      content: title
                    }
                  }]
                }
              }
            }

            console.log('Creating direct entry:', newEntry)
            const result = await window.ipcRenderer.invoke('create-notion-entry', newEntry)
            console.log('Creation result:', result)

            setMessages(prev => [...prev, {
              id: uuidv4(),
              text: `✓ Created: ${title}`,
              sent: false
            }])
          } else {
            // If no title, show the NotionBubble component
            setMessages(prev => [...prev, {
              id: uuidv4(),
              text: 'New Entry',
              sent: false,
              notionData: {
                properties: {},
                isNew: true
              },
              isEditing: true
            }])
          }
        } catch (error: any) {
          console.error('Error in /new command:', error)
          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: `Error creating entry: ${error.message}`,
            sent: false
          }])
        }
      }
    },
    {
      name: '/view',
      description: 'View recent entries',
      action: async () => {
        console.log('Fetching entries')
        try {
          const entries = await window.ipcRenderer.invoke('get-notion-entries')
          console.log('Received entries:', entries)

          const messages = entries.map(entry => ({
            id: uuidv4(),
            text: entry.properties.Name?.title[0]?.plain_text || 'Untitled',
            sent: false,
            notionData: entry
          }))
          setMessages(prev => [...prev, ...messages])
        } catch (error: any) {
          console.error('Error fetching entries:', error)
          setMessages(prev => [...prev, {
            id: uuidv4(),
            text: `Error fetching entries: ${error.message}`,
            sent: false
          }])
        }
      }
    }
  ], [newMessage, timeAnalysis, setIsDark, setIsAnalyzing])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)

    if (value.startsWith('/')) {
      setShowCommands(true)
      if (value === '/') {
        // Show all commands when only '/' is typed
        setFilteredCommands(commands)
      } else {
        // Filter commands when typing continues
        setFilteredCommands(
          commands.filter(cmd =>
            cmd.name.toLowerCase().includes(value.toLowerCase())
          )
        )
      }
      setSelectedCommandIndex(0)
    } else {
      setShowCommands(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCommands) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedCommandIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedCommandIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedCommandIndex]) {
            executeCommand(filteredCommands[selectedCommandIndex])
          }
          break
        case 'Escape':
          setShowCommands(false)
          break
      }
    }
  }

  const executeCommand = async (command: Command) => {
    setNewMessage('')
    setShowCommands(false)

    // Add the command to the message thread
    setMessages(prev => [...prev, {
      id: uuidv4(),
      text: newMessage || command.name,
      sent: true
    }])

    await command.action()
  }

  const handleCommand = async (command: string) => {
    const matchedCommand = commands.find(cmd => command.startsWith(cmd.name))
    if (matchedCommand) {
      await matchedCommand.action(command)
      setNewMessage('')
      setShowCommands(false)
      setSelectedCommandIndex(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      if (newMessage.startsWith('/')) {
        await handleCommand(newMessage.trim())
      } else {
        // ... existing message handling ...
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e)
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (showCommands && filteredCommands.length > 0) {
        e.preventDefault()
        executeCommand(filteredCommands[selectedCommandIndex])
      }
    } else if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedCommandIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedCommandIndex(prev => prev > 0 ? prev - 1 : prev)
      } else if (e.key === 'Escape') {
        setShowCommands(false)
      }
    }
  }

  useEffect(() => {
    // Handle keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault() // Prevent default browser behavior
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'dark' : ''}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4 bg-gray-100 dark:bg-gray-800">
        {messages.map((message) => (
          message.notionData ? (
            <NotionBubble
              key={message.id}
              data={message.notionData}
              isEditing={message.isEditing}
              onUpdate={async (updatedData) => {
                try {
                  console.log('Updating entry:', updatedData)
                  const result = updatedData.isNew
                    ? await window.ipcRenderer.invoke('create-notion-entry', updatedData)
                    : await window.ipcRenderer.invoke('update-notion-entry', updatedData)

                  console.log('Update result:', result)

                  // Update the message with the result
                  setMessages(prev => prev.map(msg =>
                    msg.id === message.id
                      ? {
                          ...msg,
                          notionData: result,
                          text: result.properties.Name?.title[0]?.plain_text || 'Untitled',
                          isEditing: false
                        }
                      : msg
                  ))

                  // Show success message
                  setMessages(prev => [...prev, {
                    id: uuidv4(),
                    text: `Successfully ${updatedData.isNew ? 'created' : 'updated'} entry`,
                    sent: false
                  }])
                } catch (error: any) {
                  console.error('Error updating entry:', error)
                  setMessages(prev => [...prev, {
                    id: uuidv4(),
                    text: `Error: ${error.message}`,
                    sent: false
                  }])
                }
              }}
              onDelete={async () => {
                try {
                  if (!message.notionData.isNew) {
                    await window.ipcRenderer.invoke('delete-notion-entry', message.notionData.id)
                    setMessages(prev => prev.filter(msg => msg.id !== message.id))
                    setMessages(prev => [...prev, {
                      id: uuidv4(),
                      text: 'Entry deleted successfully',
                      sent: false
                    }])
                  }
                } catch (error: any) {
                  console.error('Error deleting entry:', error)
                  setMessages(prev => [...prev, {
                    id: uuidv4(),
                    text: `Error: ${error.message}`,
                    sent: false
                  }])
                }
              }}
            />
          ) : (
            <div
              key={message.id}
              className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] break-words rounded-lg px-4 py-2 whitespace-pre-wrap ${
                  message.sent
                    ? 'bg-green-500 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
                }`}
              >
                {message.text}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 bg-white dark:bg-gray-900">
        <div className="relative flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type a message... (Enter to send, type / for commands)"
            disabled={isAnalyzing}
            className="flex-1 rounded-full px-4 py-2 border border-gray-300 dark:border-gray-600
                     focus:outline-none focus:border-green-500
                     bg-white dark:bg-gray-800
                     text-gray-800 dark:text-white"
          />

          {/* Command Palette */}
          {showCommands && filteredCommands.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {filteredCommands.map((cmd, index) => (
                <div
                  key={cmd.name}
                  onClick={() => executeCommand(cmd)}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                    ${index === selectedCommandIndex ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                >
                  <div className="font-medium text-gray-800 dark:text-white">
                    {cmd.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {cmd.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white rounded-full px-6 py-2
                     hover:bg-green-600 focus:outline-none
                     focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                     dark:ring-offset-gray-900 whitespace-nowrap"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}