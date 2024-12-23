interface MessageInputProps {
  message: string
  onMessageChange: (message: string) => void
  onSend: () => void
}

export function MessageInput({ message, onMessageChange, onSend }: MessageInputProps) {
  return (
    <div className="p-4 bg-white border-t-4 border-black flex gap-4">
      <input
        type="text"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        className="flex-1 p-2 border-2 border-black focus:outline-none text-black rounded-xl"
        placeholder="Type a message..."
      />
      <button
        onClick={onSend}
        className="px-6 py-2 bg-black text-white font-bold hover:bg-zinc-800 active:transform active:translate-y-1 rounded-xl"
      >
        SEND
      </button>
    </div>
  )
}