import { Message } from '../../types'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={`mb-4 flex ${message.sent ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[70%] p-3 rounded-2xl ${
          message.sent
            ? 'bg-black text-white rounded-br-none'
            : 'bg-white border-2 border-black text-black rounded-bl-none'
        }`}
      >
        <div>{message.text}</div>
        <div className={`text-xs mt-1 text-right ${message.sent ? 'text-white' : 'text-black'}`}>
          {message.time}
        </div>
      </div>
    </div>
  )
}