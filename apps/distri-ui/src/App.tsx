import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DistriProvider, ThemeProvider } from '@distri/react';
import { TokenProvider, useInitialization } from '@/components/TokenProvider';
import { ThreadProvider } from '@/components/ThreadContext';

// Import route components
import AuthPage from '@/routes/auth/AuthPage';
import AuthCallback from '@/routes/auth/AuthCallback';
import AuthSuccess from '@/routes/auth/AuthSuccess';
import HomeLayout from '@/layouts/HomeLayout';
import PaymentSuccess from '@/routes/payment/PaymentSuccess';
import AccountPage from '@/routes/home/menu/AccountPage';
import PricingPage from '@/routes/home/menu/PricingPage';
import HelpPage from '@/routes/home/menu/HelpPage';
import { BACKEND_URL } from './constants';
import { AccountProvider } from './components/AccountProvider';
import AgentsPage from './routes/home/AgentsPage';
import AgentDetailsPage from './routes/home/AgentDetailsPage';

function App() {
  // Initialize theme to dark by default
  useEffect(() => {
    const currentTheme = localStorage.getItem('distri-theme');
    if (!currentTheme || currentTheme === 'system') {
      localStorage.setItem('distri-theme', 'dark');
    }
  }, []);

  return (

    <ThemeProvider defaultTheme="dark" storageKey="distri-theme">
      <ThreadProvider>
        <Router>

          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* Auth routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/success" element={<AuthSuccess />} />

            {/* Protected routes with layout */}
            <Route path="/home" element={

              <TokenProvider>
                <AccountProvider>
                  <WrappedHomeLayout />
                </AccountProvider>
              </TokenProvider>

            }>
              <Route index element={<Navigate to="/home/agents" replace />} />
              <Route path="agents" element={<AgentsPage />} />
              <Route path="agents/:agentId" element={<AgentDetailsPage />} />
              <Route path="menu/account" element={<AccountPage />} />
              <Route path="menu/account/pricing" element={<PricingPage />} />
              <Route path="menu/help" element={<HelpPage />} />
            </Route>

            {/* Payment routes */}
            <Route path="/payment/success" element={<PaymentSuccess />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>

        </Router>
      </ThreadProvider>
    </ThemeProvider>
  );
}

const WrappedHomeLayout = () => {
  const { token } = useInitialization()

  return (
    <DistriProvider config={{
      baseUrl: `${BACKEND_URL}/api/v1/`,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      interceptor: async (init?: RequestInit): Promise<RequestInit | undefined> => {
        let initCopy = init || {}
        const newInit = {
          ...initCopy,
          headers: {
            ...initCopy.headers,
            'Authorization': `Bearer ${token}`
          }
        }
        return newInit
      }
    }}>
      <HomeLayout />
    </DistriProvider>
  )
}



export default App;