import { NotionCalendarService } from '../notion/NotionCalendarService'
import { NotionEvent } from '../notion/types'

interface DailyFreeTime {
  date: Date
  freeHours: number
  startTime: Date  // Start of working hours
  endTime: Date    // End of working hours
}

export class TimeAnalysisService {
  private calendarService: NotionCalendarService
  private workingHourStart = 9  // 9 AM
  private workingHourEnd = 17   // 5 PM

  constructor(calendarService: NotionCalendarService) {
    this.calendarService = calendarService
  }

  async getWeeklyFreeTime(): Promise<DailyFreeTime[]> {
    // Get start and end of next week
    const today = new Date()
    const monday = this.getNextMonday(today)
    const friday = new Date(monday)
    friday.setDate(friday.getDate() + 4)

    // Get all events for the week
    const events = await this.calendarService.getEvents({
      startDate: monday,
      endDate: friday
    })

    // Analyze each day
    const weeklyAnalysis: DailyFreeTime[] = []
    for (let i = 0; i < 5; i++) {  // Monday to Friday
      const currentDate = new Date(monday)
      currentDate.setDate(currentDate.getDate() + i)

      const dailyEvents = this.filterEventsForDay(events, currentDate)
      const freeTime = this.calculateDailyFreeTime(dailyEvents, currentDate)

      weeklyAnalysis.push(freeTime)
    }

    return weeklyAnalysis
  }

  private getNextMonday(date: Date): Date {
    const monday = new Date(date)
    monday.setDate(date.getDate() + (8 - date.getDay()) % 7)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  private filterEventsForDay(events: NotionEvent[], date: Date): NotionEvent[] {
    return events.filter(event => {
      const eventDate = new Date(event.startDate)
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear()
    })
  }

  private calculateDailyFreeTime(events: NotionEvent[], date: Date): DailyFreeTime {
    // Set up working hours for the day
    const startTime = new Date(date)
    startTime.setHours(this.workingHourStart, 0, 0, 0)

    const endTime = new Date(date)
    endTime.setHours(this.workingHourEnd, 0, 0, 0)

    // Sort events chronologically
    const sortedEvents = events.sort((a, b) =>
      a.startDate.getTime() - b.startDate.getTime()
    )

    // Calculate total busy time
    let busyMinutes = 0
    sortedEvents.forEach(event => {
      const eventStart = new Date(Math.max(event.startDate.getTime(), startTime.getTime()))
      const eventEnd = new Date(Math.min(event.endDate.getTime(), endTime.getTime()))

      if (eventEnd > eventStart) {
        busyMinutes += (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60)
      }
    })

    // Calculate free hours
    const totalWorkMinutes = (this.workingHourEnd - this.workingHourStart) * 60
    const freeHours = (totalWorkMinutes - busyMinutes) / 60

    return {
      date,
      freeHours: Math.max(0, Math.round(freeHours * 10) / 10), // Round to 1 decimal
      startTime,
      endTime
    }
  }

  formatWeeklyFreeTime(analysis: DailyFreeTime[]): string {
    const days = ['M', 'T', 'W', 'Th', 'F']
    return analysis
      .map((day, index) => `${days[index]} - ${day.freeHours} hours`)
      .join('\n')
  }
}