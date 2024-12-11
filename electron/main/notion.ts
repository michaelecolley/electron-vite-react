import { Client } from '@notionhq/client'

let notionClient: Client | null = null
let databaseId: string | null = null

export function initializeNotion() {
  try {
    const apiKey = process.env.NOTION_API_KEY
    databaseId = process.env.NOTION_DATABASE_ID

    console.log('Initializing Notion with:', {
      hasApiKey: !!apiKey,
      hasDatabaseId: !!databaseId
    })

    if (!apiKey) throw new Error('NOTION_API_KEY not found in environment variables')
    if (!databaseId) throw new Error('NOTION_DATABASE_ID not found in environment variables')

    notionClient = new Client({
      auth: apiKey,
      notionVersion: '2022-06-28'
    })

    return testConnection()
  } catch (error) {
    console.error('Failed to initialize Notion:', error)
    throw error
  }
}

async function testConnection() {
  if (!notionClient || !databaseId) {
    throw new Error('Notion client not initialized')
  }

  try {
    await notionClient.databases.retrieve({
      database_id: databaseId
    })
    console.log('Successfully connected to Notion database')
  } catch (error) {
    console.error('Failed to connect to Notion database:', error)
    throw error
  }
}

export async function getDatabaseSchema() {
  if (!notionClient || !databaseId) {
    throw new Error('Notion client not initialized')
  }

  try {
    const response = await notionClient.databases.retrieve({
      database_id: databaseId
    })

    console.log('Database schema:', {
      title: response.title,
      properties: Object.keys(response.properties),
      propertyDetails: response.properties
    })

    return response
  } catch (error) {
    console.error('Failed to get database schema:', error)
    throw error
  }
}

export async function queryDatabase(startDate: string, endDate: string) {
  if (!notionClient || !databaseId) {
    throw new Error('Notion client not initialized')
  }

  console.log('Querying Notion database:', { startDate, endDate, databaseId })

  // First, get the database schema to check property types
  const database = await notionClient.databases.retrieve({
    database_id: databaseId
  })

  // Find the date property (could be named Date, date, When, etc.)
  const dateProperty = Object.entries(database.properties).find(([name, prop]) =>
    prop.type === 'date'
  )

  if (!dateProperty) {
    throw new Error('No date property found in database')
  }

  const [propertyName, propertyDetails] = dateProperty
  console.log('Found date property:', { name: propertyName, type: propertyDetails.type })

  const response = await notionClient.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        {
          property: propertyName,
          date: {
            on_or_after: startDate,
          },
        },
        {
          property: propertyName,
          date: {
            on_or_before: endDate,
          },
        },
      ],
    },
    sorts: [
      {
        property: propertyName,
        direction: 'ascending'
      }
    ]
  })

  console.log('Notion query response:', {
    resultCount: response.results.length,
    dateProperty: propertyName
  })

  return {
    results: response.results,
    datePropertyName: propertyName // Return the property name for the client
  }
}

export async function queryTasksByStatus(statusFilter: string) {
  if (!notionClient || !databaseId) {
    throw new Error('Notion client not initialized')
  }

  console.log('Querying tasks with status:', statusFilter)

  // First, get the database schema to check property types
  const database = await notionClient.databases.retrieve({
    database_id: databaseId
  })

  // Find the status property and its type
  const statusProperty = Object.entries(database.properties).find(([name, prop]) =>
    name.toLowerCase() === 'status' || name.toLowerCase() === 'state'
  )

  if (!statusProperty) {
    throw new Error('No status/state property found in database')
  }

  const [propertyName, propertyDetails] = statusProperty
  console.log('Found status property:', { name: propertyName, type: propertyDetails.type })

  // Build filter based on property type
  let filter
  switch (propertyDetails.type) {
    case 'select':
      filter = {
        property: propertyName,
        select: {
          equals: statusFilter.toLowerCase()
        }
      }
      break
    case 'status':
      filter = {
        property: propertyName,
        status: {
          equals: statusFilter.toLowerCase()
        }
      }
      break
    default:
      throw new Error(`Unsupported status property type: ${propertyDetails.type}`)
  }

  const response = await notionClient.databases.query({
    database_id: databaseId,
    filter,
    sorts: [
      {
        property: 'Created time',
        direction: 'descending'
      }
    ]
  })

  console.log(`Found ${response.results.length} tasks with status: ${statusFilter}`)
  return response.results
}