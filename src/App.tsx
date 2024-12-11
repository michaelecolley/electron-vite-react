import { useState } from 'react'
import UpdateElectron from '@/components/update'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'
import Chat from './components/Chat'

function App() {
  return (
    <div className="flex h-screen w-screen bg-white p-0">
      <div className="w-full max-w-4xl mx-auto">
        <Chat />
      </div>
    </div>
  )
}

export default App