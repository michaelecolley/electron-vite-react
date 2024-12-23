import { Task } from './task'

interface EmailTask extends Task {
  type: 'email'
  metadata: {
    from: string
    to: string[]
    subject: string
    content: string
    attachments?: {
      name: string
      url: string
      size: number
    }[]
  }
}

export type { EmailTask }