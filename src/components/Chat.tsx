import { useState, useEffect, useRef } from 'react'

interface Message {
  id: number
  text: string
  sent: boolean
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isDark, setIsDark] = useState(true) // Default to dark mode
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle theme commands
  const handleCommand = (command: string) => {
    switch (command.toLowerCase()) {
      case '/dark':
        setIsDark(true)
        setNewMessage('')
        document.documentElement.classList.add('dark')
        return true
      case '/light':
        setIsDark(false)
        setNewMessage('')
        document.documentElement.classList.remove('dark')
        return true
      default:
        return false
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
        <div className="flex gap-2 max-w-full mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (⌘K to focus, /dark or /light to toggle theme)"
            className="flex-1 rounded-full px-4 py-2 border border-gray-300 dark:border-gray-600
                     focus:outline-none focus:border-green-500
                     bg-white dark:bg-gray-800
                     text-gray-800 dark:text-white"
          />
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