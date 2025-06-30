import React, { useState } from 'react'
import { useDistri } from '@distri/react'
import AgentList from './components/AgentList'
import Chat from './components/Chat'
import './App.css'

function App() {
  const { error } = useDistri()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Initialization Error</h2>
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
          Framework: Distri Agent Platform
        </div>
      </header>

      <main className="app-main">
        <div className="sidebar">
          <h2>Agents</h2>
          <AgentList 
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
          />
        </div>

        <div className="content">
          {selectedAgentId ? (
            <Chat agentId={selectedAgentId} />
          ) : (
            <div className="welcome">
              <h2>Welcome to Distri</h2>
              <p>Select an agent from the sidebar to start chatting!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App