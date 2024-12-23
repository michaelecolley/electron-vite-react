import { Chat } from '../../types'

interface ChatListProps {
  chats: Chat[]
  selectedChat: number
  onSelectChat: (id: number) => void
}

export function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
  return (
    <div className="w-1/3 border-r-4 border-black bg-white flex flex-col">
      <div className="p-4 bg-black text-white font-bold text-xl border-b-4 border-white">
        CHATS
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`p-4 cursor-pointer border-b-2 border-black hover:bg-zinc-100 ${
              selectedChat === chat.id ? 'bg-zinc-200' : ''
            }`}
          >
            <div className="font-bold text-black">{chat.name}</div>
            <div className="flex justify-between text-sm text-black">
              <span>{chat.lastMessage}</span>
              <span>{chat.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}