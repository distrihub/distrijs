import React from 'react'
import ReactDOM from 'react-dom/client'
import { DistriProvider } from '@distri/react'
import App from './App'
import './index.css'

// Demo configuration - in a real app, this would come from environment variables
const config = {
  baseUrl: (import.meta as any).env?.VITE_DISTRI_BASE_URL || 'http://localhost:8080',
  apiVersion: 'v1',
  debug: (import.meta as any).env?.DEV || false,
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