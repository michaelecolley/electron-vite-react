import { useAtom } from 'jotai'
import { Command } from 'cmdk'
import { useEffect, useState } from 'react'
import { filteredTasksAtom, selectedTaskIdAtom } from '../state/tasks'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [tasks] = useAtom(filteredTasksAtom)
  const [, setSelectedTaskId] = useAtom(selectedTaskIdAtom)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(open => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] bg-white rounded-lg shadow-xl"
    >
      <Command.Input
        className="w-full p-4 border-b border-gray-200"
        placeholder="Search tasks..."
      />
    </Command.Dialog>
  )
}