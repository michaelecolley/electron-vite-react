import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'
import dotenv from 'dotenv'
import { initializeNotion, queryDatabase, getDatabaseSchema, queryTasksByStatus, getNotionEntries, createNotionEntry, updateNotionEntry, deleteNotionEntry } from './notion'

// Load environment variables
dotenv.config()

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

let notionInitialized = false

async function initializeNotionClient() {
  try {
    await initializeNotion()
    notionInitialized = true
    console.log('Notion client initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Notion client:', error)
    notionInitialized = false
  }
}

function setupIpcHandlers() {
  console.log('Setting up IPC handlers...')

  ipcMain.handle('get-notion-schema', async () => {
    try {
      console.log('Handling get-notion-schema request')
      if (!notionInitialized) {
        await initializeNotionClient()
      }
      const schema = await getDatabaseSchema()
      console.log('Schema retrieved')
      return schema
    } catch (error) {
      console.error('Error in get-notion-schema:', error)
      throw error
    }
  })

  ipcMain.handle('get-notion-entries', async () => {
    try {
      console.log('Handling get-notion-entries request')
      if (!notionInitialized) {
        await initializeNotionClient()
      }
      const entries = await getNotionEntries()
      console.log('Entries retrieved:', entries.length)
      return entries
    } catch (error) {
      console.error('Error in get-notion-entries:', error)
      throw error
    }
  })

  ipcMain.handle('create-notion-entry', async (_, data) => {
    try {
      console.log('Handling create-notion-entry request')
      if (!notionInitialized) {
        await initializeNotionClient()
      }
      return await createNotionEntry(data)
    } catch (error) {
      console.error('Error in create-notion-entry:', error)
      throw error
    }
  })

  ipcMain.handle('update-notion-entry', async (_, data) => {
    try {
      if (!notionInitialized) {
        await initializeNotionClient()
      }
      return await updateNotionEntry(data)
    } catch (error) {
      console.error('Error in update-notion-entry:', error)
      throw error
    }
  })

  ipcMain.handle('delete-notion-entry', async (_, pageId) => {
    try {
      if (!notionInitialized) {
        await initializeNotionClient()
      }
      return await deleteNotionEntry(pageId)
    } catch (error) {
      console.error('Error in delete-notion-entry:', error)
      throw error
    }
  })
}

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Setup IPC handlers before loading the page
  setupIpcHandlers()

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
