export interface NotionEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  description?: string
  attendees?: string[]
  location?: string
  accountId: string
}

export interface NotionAccount {
  id: string
  name: string
  authToken: string
}

export interface CalendarQueryParams {
  startDate?: Date
  endDate?: Date
  accounts?: string[]  // array of account IDs to filter by
}