import { useState, useEffect, useRef, useMemo } from 'react'
import { TimeAnalysisService } from '../services/analysis/TimeAnalysisService'
import { NotionCalendarService } from '../services/notion/NotionCalendarService'

interface Message {
  id: number
  text: string
  sent: boolean
}

interface Command {
  name: string
  description: string
  action: () => Promise<void> | void
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

  const commands: Command[] = useMemo(() => [
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
            id: Date.now(),
            text: `Free time for next week:\n${formattedAnalysis}`,
            sent: false
          }])
        } catch (error) {
          setMessages(prev => [...prev, {
            id: Date.now(),
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
            id: Date.now(),
            text: `Notion Database Schema:\n${JSON.stringify(response.properties, null, 2)}`,
            sent: false
          }])
        } catch (error) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: `Error testing Notion connection: ${error.message}`,
            sent: false
          }])
        }
      }
    }
  ], [timeAnalysis, setIsDark, setIsAnalyzing])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)

    if (value.startsWith('/')) {
      setShowCommands(true)
      setFilteredCommands(
        commands.filter(cmd =>
          cmd.name.toLowerCase().includes(value.toLowerCase())
        )
      )
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
    await command.action()
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

  const handleSend = () => {
    if (newMessage.trim()) {
      // Check if message is a command
      if (!handleCommand(newMessage.trim())) {
        setMessages([
          ...messages,
          {
            id: Date.now(),
            text: newMessage,
            sent: true
          }
        ])
      }
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'dark' : ''}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4 bg-gray-100 dark:bg-gray-800">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] break-words rounded-lg px-4 py-2 ${
                message.sent
                  ? 'bg-green-500 text-white rounded-br-none'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex gap-2 max-w-full mx-auto relative">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (⌘K to focus, type / for commands)"
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
            onClick={handleSend}
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