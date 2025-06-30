import { useState } from 'react'
import { useDistri } from '@distri/react'
import AgentList from './components/AgentList'
import Chat from './components/Chat'
import './App.css'

function App() {
  const { client, error, isLoading } = useDistri()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">
          <h2>Connecting to Distri...</h2>
          <p>Initializing client connection...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Connection Error</h2>
          <p>{error.message}</p>
          <details>
            <summary>Troubleshooting</summary>
            <ul>
              <li>Make sure the Distri server is running on <code>http://localhost:8080</code></li>
              <li>Check that the server is accessible and CORS is configured</li>
              <li>Verify the API endpoints are available</li>
            </ul>
          </details>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="app">
        <div className="error">
          <h2>Client Not Available</h2>
          <p>Distri client is not initialized</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Distri SDK Demo</h1>
        <div className="connection-status">
          <span className="status-indicator connected"></span>
          Connected to Distri Platform
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