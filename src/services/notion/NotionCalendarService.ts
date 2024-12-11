import { Client } from '@notionhq/client'
import { NotionEvent, NotionAccount, CalendarQueryParams } from './types'

export class NotionCalendarService {
  private clients: Map<string, Client> = new Map()

  constructor(accounts: NotionAccount[]) {
    // Initialize a Notion client for each account
    accounts.forEach(account => {
      this.clients.set(account.id, new Client({ auth: account.authToken }))
    })
  }

  async createEvent(event: Omit<NotionEvent, 'id'>): Promise<NotionEvent> {
    const client = this.clients.get(event.accountId)
    if (!client) throw new Error('Account not found')

    try {
      const response = await client.pages.create({
        parent: { database_id: process.env.NOTION_CALENDAR_DB_ID! },
        properties: {
          Name: { title: [{ text: { content: event.title } }] },
          Date: {
            date: {
              start: event.startDate.toISOString(),
              end: event.endDate.toISOString(),
            },
          },
          Description: event.description
            ? { rich_text: [{ text: { content: event.description } }] }
            : undefined,
          Location: event.location
            ? { rich_text: [{ text: { content: event.location } }] }
            : undefined,
          Attendees: event.attendees
            ? { multi_select: event.attendees.map(a => ({ name: a })) }
            : undefined,
        },
      })

      return {
        ...event,
        id: response.id,
      }
    } catch (error) {
      console.error('Failed to create event:', error)
      throw error
    }
  }

  async getEvents(params: CalendarQueryParams): Promise<NotionEvent[]> {
    const events: NotionEvent[] = []
    const accountsToQuery = params.accounts || Array.from(this.clients.keys())

    for (const accountId of accountsToQuery) {
      const client = this.clients.get(accountId)
      if (!client) continue

      try {
        const response = await client.databases.query({
          database_id: process.env.NOTION_CALENDAR_DB_ID!,
          filter: {
            and: [
              {
                property: 'Date',
                date: {
                  on_or_after: params.startDate?.toISOString(),
                },
              },
              {
                property: 'Date',
                date: {
                  on_or_before: params.endDate?.toISOString(),
                },
              },
            ],
          },
        })

        const accountEvents = response.results.map(page => ({
          id: page.id,
          title: page.properties.Name.title[0].plain_text,
          startDate: new Date(page.properties.Date.date.start),
          endDate: new Date(page.properties.Date.date.end),
          description: page.properties.Description?.rich_text[0]?.plain_text,
          location: page.properties.Location?.rich_text[0]?.plain_text,
          attendees: page.properties.Attendees?.multi_select.map(a => a.name),
          accountId,
        }))

        events.push(...accountEvents)
      } catch (error) {
        console.error(`Failed to fetch events for account ${accountId}:`, error)
      }
    }

    return events
  }

  // Add more methods as needed for updating and deleting events
}