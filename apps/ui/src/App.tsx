import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DistriProvider, ThemeProvider, useDistri } from '@distri/react';
import {
  DistriHomeInfraProvider,
  DistriHomeProvider,
  DashboardLayout,
  homeRoutes,
} from '@distri/home';
import { TokenProvider, useInitialization } from '@/components/TokenProvider';
import { SessionProvider, useSession } from '@/components/SessionProvider';
import { AccountProvider } from '@/components/AccountProvider';
import { ThreadProvider } from '@/components/ThreadContext';
import { Toaster } from 'sonner';

// App-specific routes (not in @distri/home)
import AuthPage from '@/routes/auth/AuthPage';
import AuthCallback from '@/routes/auth/AuthCallback';
import AuthSuccess from '@/routes/auth/AuthSuccess';
import LoginPage from '@/routes/login/LoginPage';
import FilesPage from '@/routes/home/FilesPage';

import { BACKEND_URL } from './constants';

function App() {
  useEffect(() => {
    const currentTheme = localStorage.getItem('distri-theme');
    if (!currentTheme || currentTheme === 'system') {
      localStorage.setItem('distri-theme', 'dark');
    }
  }, []);

  const basePath = import.meta.env.BASE_URL || '/ui/';

  return (
    <ThemeProvider defaultTheme="dark" storageKey="distri-theme">
      <ThreadProvider>
        <Router basename={basePath}>
          <SessionProvider>
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/agents" replace />} />

              {/* Auth routes (app-specific) */}
              <Route path="auth" element={<AuthPage />} />
              <Route path="auth/callback" element={<AuthCallback />} />
              <Route path="auth/success" element={<AuthSuccess />} />
              <Route path="login" element={<LoginPage />} />

              {/* Protected routes — DashboardLayout + homeRoutes() */}
              <Route element={<LayoutWithProviders />}>
                {homeRoutes()}
                {/* Workspace: app-specific file editor, not in @distri/home */}
                <Route path="workspace" element={<FilesPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/agents" replace />} />
            </Routes>

            <Toaster position="top-right" richColors closeButton />
          </SessionProvider>
        </Router>
      </ThreadProvider>
    </ThemeProvider>
  );
}

/** Checks session + token, renders DistriProvider, then hands off to HomeShell */
const LayoutWithProviders = () => (
  <TokenProvider>
    <AccountProvider>
      <ProtectedLayout />
    </AccountProvider>
  </TokenProvider>
);

const ProtectedLayout = () => {
  const { token } = useInitialization();
  const { sessionId, loading: sessionLoading } = useSession();
  const location = useLocation();

  if (sessionLoading) {
    return <LoadingScreen message="Checking your device session..." />;
  }

  if (!sessionId) {
    const redirectPath = `${location.pathname}${location.search}`;
    return <Navigate to="/login" state={{ from: redirectPath }} replace />;
  }

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  return (
    <DistriProvider
      config={{
        baseUrl: `${BACKEND_URL}/v1/`,
        headers: authHeaders,
        interceptor: async (init?: RequestInit): Promise<RequestInit | undefined> => {
          if (!token) return init;
          const initCopy = init || {};
          return {
            ...initCopy,
            headers: {
              ...initCopy.headers,
              Authorization: `Bearer ${token}`,
            },
          };
        },
      }}
    >
      <HomeShell />
    </DistriProvider>
  );
};

/** Reads DistriClient from DistriProvider, wires legacy infra + new home context, renders layout */
const HomeShell = () => {
  const { client } = useDistri();
  const navigate = useNavigate();

  if (!client) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <DistriHomeInfraProvider
      client={client}
      config={{
        navigationPaths: {
          agentDetails: (id: string) => `/agents/${encodeURIComponent(id)}`,
        },
      }}
      onNavigate={navigate}
    >
      <DistriHomeProvider config={{}}>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </DistriHomeProvider>
    </DistriHomeInfraProvider>
  );
};

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="loading-spinner" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
);

export default App;
