import React from 'react'
import ReactDOM from 'react-dom/client'
import { DistriProvider } from '@distri/react'
import App from './App'

// Demo configuration - in a real app, this would come from environment variables
const config = {
  baseUrl: 'http://localhost:8080', // Replace with your Distri server URL
  apiVersion: 'v1',
  debug: true,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DistriProvider config={config}>
      <App />
    </DistriProvider>
  </React.StrictMode>
)