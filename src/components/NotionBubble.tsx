import { useState, useEffect } from 'react'

interface NotionProperty {
  type: string
  status?: { options: Array<{ name: string, id: string }> }
  select?: { options: Array<{ name: string }> }
}

interface NotionPage {
  id?: string
  properties: Record<string, any>
  isNew?: boolean
}

interface NotionBubbleProps {
  data: NotionPage
  isEditing?: boolean
  onUpdate: (data: NotionPage) => Promise<void>
  onDelete: () => Promise<void>
}

export function NotionBubble({ data, isEditing: initialEditing, onUpdate, onDelete }: NotionBubbleProps) {
  const [isEditing, setIsEditing] = useState(initialEditing ?? data.isNew ?? false)
  const [formData, setFormData] = useState(data)
  const [schema, setSchema] = useState<Record<string, NotionProperty>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.ipcRenderer.invoke('get-notion-schema')
      .then(schema => {
        console.log('Full schema response:', schema)
        setSchema(schema.properties)

        if (data.isNew) {
          const initialProperties: Record<string, any> = {}
          Object.entries(schema.properties).forEach(([key, prop]) => {
            if (prop.type === 'status') {
              const inboxOption = prop.status?.options.find(opt => opt.name === 'Inbox')
              if (inboxOption) {
                initialProperties[key] = {
                  type: 'status',
                  status: {
                    id: inboxOption.id,
                    name: 'Inbox'
                  }
                }
              }
            } else if (prop.type === 'title') {
              initialProperties[key] = {
                type: 'title',
                title: [{ type: 'text', text: { content: '' } }]
              }
            }
            switch (prop.type) {
              case 'rich_text':
                initialProperties[key] = {
                  type: 'rich_text',
                  rich_text: [{ type: 'text', text: { content: '' } }]
                }
                break
              case 'select':
                initialProperties[key] = {
                  type: 'select',
                  select: null
                }
                break
              case 'date':
                initialProperties[key] = {
                  type: 'date',
                  date: null
                }
                break
              case 'checkbox':
                initialProperties[key] = {
                  type: 'checkbox',
                  checkbox: false
                }
                break
              case 'url':
                initialProperties[key] = {
                  type: 'url',
                  url: ''
                }
                break
            }
          })
          setFormData(prev => ({
            ...prev,
            properties: initialProperties
          }))
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to load schema:', error)
        setLoading(false)
      })
  }, [data.isNew])

  const renderInput = (key: string, prop: NotionProperty) => {
    const value = formData.properties[key]

    switch (prop.type) {
      case 'title':
        return (
          <input
            type="text"
            value={value?.title?.[0]?.text?.content || ''}
            onChange={(e) => handleInputChange(key, 'title', e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder={`Enter ${key.toLowerCase()}`}
          />
        )

      case 'status':
        return (
          <select
            value={value?.status?.name || 'Inbox'}
            onChange={(e) => handleInputChange(key, 'status', e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            {prop.status?.options.map(option => (
              <option key={option.id} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        )

      case 'rich_text':
        return (
          <input
            type="text"
            value={value?.[prop.type]?.[0]?.text?.content || ''}
            onChange={(e) => handleInputChange(key, 'text', e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder={`Enter ${key.toLowerCase()}`}
          />
        )

      case 'select':
        return (
          <select
            value={value?.select?.name || ''}
            onChange={(e) => handleInputChange(key, 'select', e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select {key.toLowerCase()}</option>
            {prop.select?.options.map(option => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        )

      case 'date':
        return (
          <input
            type="date"
            value={value?.date?.start || ''}
            onChange={(e) => handleInputChange(key, 'date', e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        )

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value?.checkbox || false}
            onChange={(e) => handleInputChange(key, 'checkbox', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
        )

      case 'url':
        return (
          <input
            type="url"
            value={value?.url || ''}
            onChange={(e) => handleInputChange(key, 'url', e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="Enter URL"
          />
        )

      default:
        return null
    }
  }

  const handleInputChange = (key: string, type: string, value: any) => {
    console.log('Handling input change:', { key, type, value })
    setFormData(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [key]: type === 'status'
          ? {
              type: 'status',
              status: schema[key]?.status?.options.find(opt => opt.name === value) || {
                id: schema[key]?.status?.options.find(opt => opt.name === 'Inbox')?.id,
                name: 'Inbox'
              }
            }
          : type === 'title'
          ? {
              type: 'title',
              title: [{ type: 'text', text: { content: value } }]
            }
          : type === 'url'
          ? {
              type: 'url',
              url: value || null
            }
          : type === 'date'
          ? {
              type: 'date',
              date: value ? { start: value } : null
            }
          : type === 'checkbox'
          ? {
              type: 'checkbox',
              checkbox: Boolean(value)
            }
          : type === 'select'
          ? {
              type: 'select',
              select: value ? { name: value } : null
            }
          : null
      }
    }))
  }

  const formatPropertyForApi = (key: string, value: any, type: string) => {
    if (value === '' || value === null || value === undefined) {
      if (type === 'status') {
        const inboxOption = schema[key]?.status?.options.find(opt => opt.name === 'Inbox')
        return {
          type: 'status',
          status: inboxOption || null
        }
      }
      return null
    }

    switch (type) {
      case 'status':
        const statusOption = schema[key]?.status?.options.find(opt =>
          opt.name === (value?.name || value)
        )
        return {
          type: 'status',
          status: statusOption || null
        }
      case 'title':
        return {
          type: 'title',
          title: [{ type: 'text', text: { content: value } }]
        }
      case 'rich_text':
        return {
          type: 'rich_text',
          rich_text: [{ type: 'text', text: { content: value } }]
        }
      case 'url':
        return {
          type: 'url',
          url: value || null
        }
      case 'date':
        return {
          type: 'date',
          date: value ? { start: value } : null
        }
      case 'checkbox':
        return {
          type: 'checkbox',
          checkbox: Boolean(value)
        }
      case 'select':
        return {
          type: 'select',
          select: value ? { name: value } : null
        }
      default:
        return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Format properties for API
    const formattedProperties: Record<string, any> = {}

    Object.entries(schema).forEach(([key, prop]) => {
      if (prop.type === 'status') {
        const statusValue = formData.properties[key]?.status
        const statusOption = schema[key]?.status?.options.find(opt =>
          opt.name === (statusValue?.name || 'Inbox')
        )
        if (statusOption) {
          formattedProperties[key] = {
            type: 'status',
            status: statusOption
          }
        }
      } else {
        const value = formData.properties[key]?.[prop.type]?.[0]?.text?.content
          || formData.properties[key]?.[prop.type]
          || null

        const formatted = formatPropertyForApi(key, value, prop.type)
        if (formatted) {
          formattedProperties[key] = formatted
        }
      }
    })

    // Ensure we have at least a title
    if (!formattedProperties.Name) {
      formattedProperties.Name = formatPropertyForApi('Name', 'Untitled', 'title')
    }

    console.log('Submitting formatted properties:', formattedProperties)

    await onUpdate({
      ...formData,
      properties: formattedProperties
    })
  }

  if (loading) {
    return <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">Loading...</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <form onSubmit={handleSubmit}>
        {Object.entries(schema).map(([key, prop]) => (
          prop.type !== 'created_time' && prop.type !== 'last_edited_time' && (
            <div key={key} className="mb-4">
              <label className="block text-sm font-medium mb-1">{key}</label>
              {renderInput(key, prop)}
            </div>
          )
        ))}

        <div className="flex justify-end space-x-2 mt-4">
          {!data.isNew && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {data.isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}