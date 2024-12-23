interface ChatHeaderProps {
  name: string
}

export function ChatHeader({ name }: ChatHeaderProps) {
  return (
    <div className="p-4 bg-black text-white font-bold text-xl border-b-4 border-white">
      {name}
    </div>
  )
}