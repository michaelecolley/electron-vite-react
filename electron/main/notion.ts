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

export async function queryDatabase(startDate: string, endDate: string) {
  if (!notionClient || !databaseId) {
    throw new Error('Notion client not initialized')
  }

  console.log('Querying Notion database:', { startDate, endDate, databaseId })

  const response = await notionClient.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        {
          property: 'Date',
          date: {
            on_or_after: startDate,
          },
        },
        {
          property: 'Date',
          date: {
            on_or_before: endDate,
          },
        },
      ],
    },
  })

  console.log('Notion query response:', {
    resultCount: response.results.length
  })

  return response.results
}

// Simple test function to get database schema
export async function getDatabaseSchema() {
  if (!notionClient || !databaseId) {
    throw new Error('Notion client not initialized')
  }

  const response = await notionClient.databases.retrieve({
    database_id: databaseId
  })

  console.log('Database schema:', {
    title: response.title,
    properties: Object.keys(response.properties),
    propertyDetails: response.properties
  })

  return response
}