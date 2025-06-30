import React from 'react'
import ReactDOM from 'react-dom/client'
import { DistriProvider } from '@distri/react'
import App from './App'

// Demo configuration - in a real app, this would come from environment variables
const config = {
  node: {
    id: 'demo-client',
    name: 'Demo Client',
    endpoint: 'ws://localhost:8080', // Replace with your Distri node endpoint
    status: 'connecting' as const,
    capabilities: ['threads', 'messages', 'reactions']
  },
  autoConnect: true,
  debug: true
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DistriProvider config={config}>
      <App />
    </DistriProvider>
  </React.StrictMode>
)