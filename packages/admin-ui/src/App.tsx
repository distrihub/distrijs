import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { DistriProvider } from '@distri/react'
import { SidebarProvider } from './components/ui/sidebar'
import { ThemeProvider } from './components/ThemeProvider'
import { AdminSidebar } from './components/AdminSidebar'
import { DefinitionsPage } from './pages/DefinitionsPage'
import { PromptsPage } from './pages/PromptsPage'
import { DefinitionNewPage } from './pages/DefinitionNewPage'
import { DefinitionChatPage } from './pages/DefinitionChatPage'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const getCurrentPage = () => {
    const path = location.pathname
    if (path.startsWith('/definitions')) return 'definitions'
    if (path.startsWith('/prompts')) return 'prompts'
    return 'definitions'
  }

  const handleNavigation = (page: string) => {
    if (page === 'definitions') {
      navigate('/definitions')
    } else if (page === 'prompts') {
      navigate('/prompts')
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="distri-admin-ui-theme">
      <DistriProvider
        serverUrl="http://localhost:8080"
        enableStreaming={true}
      >
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AdminSidebar 
              currentPage={getCurrentPage()}
              onPageChange={handleNavigation}
            />
            <div className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<DefinitionsPage />} />
                <Route path="/definitions" element={<DefinitionsPage />} />
                <Route path="/definitions/new" element={<DefinitionNewPage />} />
                <Route path="/definitions/chat" element={<DefinitionChatPage />} />
                <Route path="/prompts" element={<PromptsPage />} />
              </Routes>
            </div>
          </div>
        </SidebarProvider>
      </DistriProvider>
    </ThemeProvider>
  )
}

export default App