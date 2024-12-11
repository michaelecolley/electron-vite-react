import { NotionEvent, CalendarQueryParams } from './types'

export class NotionCalendarService {
  async getEvents(params: CalendarQueryParams): Promise<NotionEvent[]> {
    try {
      console.log('Fetching events with params:', {
        startDate: params.startDate?.toISOString(),
        endDate: params.endDate?.toISOString(),
      })

      const results = await window.ipcRenderer.invoke(
        'query-notion-calendar',
        params.startDate?.toISOString(),
        params.endDate?.toISOString()
      )

      console.log('Received response:', {
        resultCount: results.length,
        firstResult: results[0] ? 'exists' : 'none'
      })

      return results.map(page => ({
        id: page.id,
        title: page.properties.Name.title[0]?.plain_text || '',
        startDate: new Date(page.properties.Date.date.start),
        endDate: new Date(page.properties.Date.date.end || page.properties.Date.date.start),
        description: page.properties.Description?.rich_text[0]?.plain_text,
        location: page.properties.Location?.rich_text[0]?.plain_text,
        attendees: page.properties.Attendees?.multi_select?.map(a => a.name) || [],
        accountId: 'default'
      }))
    } catch (error) {
      console.error('Failed to fetch events:', error)
      throw error
    }
  }
}