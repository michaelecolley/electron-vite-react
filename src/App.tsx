import { useState } from 'react'
import { ChatList } from './components/chat/ChatList'
import { ChatMessage } from './components/chat/ChatMessage'
import { MessageInput } from './components/chat/MessageInput'
import { ChatHeader } from './components/chat/ChatHeader'
import { Chat, Message } from './types'

// Dummy data for chats
const dummyChats: Chat[] = [
  { id: 1, name: 'Alice Cooper', lastMessage: 'Hey, how are you?', time: '10:30 AM' },
  { id: 2, name: 'Bob Dylan', lastMessage: 'Meeting at 3?', time: '9:45 AM' },
  { id: 3, name: 'Charlie Puth', lastMessage: 'Got the files!', time: 'Yesterday' },
  { id: 4, name: 'David Bowie', lastMessage: 'Thanks!', time: 'Yesterday' },
]

const dummyMessages: Message[] = [
  { id: 1, text: 'Hey there!', sent: true, time: '10:30 AM' },
  { id: 2, text: 'Hi! How are you?', sent: false, time: '10:31 AM' },
  { id: 3, text: 'I\'m good, thanks! Working on that project.', sent: true, time: '10:32 AM' },
  { id: 4, text: 'That\'s great! Need any help?', sent: false, time: '10:33 AM' },
]

function App() {
  const [message, setMessage] = useState('')
  const [selectedChat, setSelectedChat] = useState(1)

  const handleSend = () => {
    if (message.trim()) {
      // Here you would typically add the message to your messages state
      setMessage('')
    }
  }

  const selectedChatName = dummyChats.find(chat => chat.id === selectedChat)?.name || ''

  return (
    <div className="h-screen w-screen flex bg-zinc-100">
      <ChatList
        chats={dummyChats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader name={selectedChatName} />

        <div className="flex-1 overflow-y-auto p-4 bg-zinc-100">
          {dummyMessages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>

        <MessageInput
          message={message}
          onMessageChange={setMessage}
          onSend={handleSend}
        />
      </div>
    </div>
  )
}

export default App