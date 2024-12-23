export interface Chat {
  id: number
  name: string
  lastMessage: string
  time: string
}

export interface Message {
  id: number
  text: string
  sent: boolean
  time: string
}