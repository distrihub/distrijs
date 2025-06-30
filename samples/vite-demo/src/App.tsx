import React, { useState } from 'react'
import { useDistri, useThreads } from '@distri/react'
import ThreadList from './components/ThreadList'
import Chat from './components/Chat'
import './App.css'

function App() {
  const { connectionStatus, error } = useDistri()
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Connection Error</h2>
          <p>{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Distri SDK Demo</h1>
        <div className="connection-status">
          Status: <span className={`status ${connectionStatus}`}>{connectionStatus}</span>
        </div>
      </header>

      <main className="app-main">
        <div className="sidebar">
          <h2>Threads</h2>
          <ThreadList 
            selectedThreadId={selectedThreadId}
            onSelectThread={setSelectedThreadId}
          />
        </div>

        <div className="content">
          {selectedThreadId ? (
            <Chat threadId={selectedThreadId} />
          ) : (
            <div className="welcome">
              <h2>Welcome to Distri</h2>
              <p>Select a thread from the sidebar to start chatting!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App