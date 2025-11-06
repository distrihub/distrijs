'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface TokenContextType {
  token: string | null
  setToken: (token: string | null) => void,
  error: string | null
}

const TokenContext = createContext<TokenContextType | undefined>(undefined)

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // useEffect(() => {
  //   const storedToken = localStorage.getItem('auth_token')
  //   if (storedToken) {
  //     setToken(storedToken)
  //     // Redirect to /home/agents after successful login if not in iframe
  //     if (location.pathname === '/auth/success' || location.pathname === '/') {
  //       navigate('/home/agents')
  //     }
  //     return
  //   }
  //   navigate('/auth')


  // }, [navigate, location.pathname])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <img
            src="/images/blinksheets.png"
            alt="Blink AI"
            className="h-16 w-auto"
          />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <TokenContext.Provider value={{ token, setToken, error }}>
      {children}
    </TokenContext.Provider>
  )
}

export const useInitialization = () => {
  const context = useContext(TokenContext)
  if (context === undefined) {
    throw new Error('useToken must be used within a TokenProvider')
  }
  return context
}
