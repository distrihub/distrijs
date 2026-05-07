import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DistriProvider, ThemeProvider, useDistri } from '@distri/react';
import {
  DistriHomeProvider,
  DistriHomeClient,
  homeRoutes,
} from '@distri/home';
import { AppShell } from '@/components/AppShell';
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
  // OSS is always dark — match cloud. Apply synchronously before paint so
  // there is no FOUC, and ignore any stale localStorage preference.
  if (typeof window !== 'undefined') {
    localStorage.setItem('distri-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }

  const basePath = import.meta.env.BASE_URL || '/ui/';

  return (
    <ThemeProvider defaultTheme="dark" storageKey="distri-theme">
      <ThreadProvider>
        <Router basename={basePath}>
          <SessionProvider>
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/home" replace />} />

              {/* Auth routes (app-specific) */}
              <Route path="auth" element={<AuthPage />} />
              <Route path="auth/callback" element={<AuthCallback />} />
              <Route path="auth/success" element={<AuthSuccess />} />
              <Route path="login" element={<LoginPage />} />

              {/* Protected routes — DashboardLayout + homeRoutes() */}
              <Route element={<LayoutWithProviders />}>
                {homeRoutes()}
                {/* Workspace files: app-specific file editor (not in @distri/home).
                    Distinct from /workspace/agents|skills|templates which come
                    from homeRoutes. */}
                <Route path="files" element={<FilesPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/home" replace />} />
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

  // OSS has no JWT — the server is permissive. Bind accessToken to whatever
  // the device session uses so DistriClient stops short-circuiting on
  // "No access token available", and pass it as the bearer header.
  const effectiveToken = token ?? sessionId ?? 'oss-anonymous';
  const authHeaders = { Authorization: `Bearer ${effectiveToken}` };

  return (
    <DistriProvider
      config={{
        baseUrl: `${BACKEND_URL}/v1/`,
        accessToken: effectiveToken,
        headers: authHeaders,
        interceptor: async (init?: RequestInit): Promise<RequestInit | undefined> => {
          const initCopy = init || {};
          return {
            ...initCopy,
            headers: {
              ...initCopy.headers,
              Authorization: `Bearer ${effectiveToken}`,
            },
          };
        },
      }}
    >
      <HomeShell />
    </DistriProvider>
  );
};

/** Reads DistriClient from DistriProvider, wires unified home context, renders layout */
const HomeShell = () => {
  const { client } = useDistri();
  const navigate = useNavigate();

  if (!client) {
    return <LoadingScreen message="Initializing..." />;
  }

  const homeClient = new DistriHomeClient(client);
  const openCopilot = () => navigate('/copilot');

  // Cmd/Ctrl-K opens the Distri copilot — same shortcut as cloud.
  if (typeof window !== 'undefined' && !(window as { __distriCopilotKey?: boolean }).__distriCopilotKey) {
    (window as { __distriCopilotKey?: boolean }).__distriCopilotKey = true;
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/copilot');
      }
    });
  }

  return (
    <DistriHomeProvider
      config={{
        homeClient,
        navigate,
        navigationPaths: {
          agentDetails: (id: string) => `/agents/${encodeURIComponent(id)}`,
        },
      }}
    >
      <AppShell onOpenCopilot={openCopilot}>
        <Outlet />
      </AppShell>
    </DistriHomeProvider>
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
