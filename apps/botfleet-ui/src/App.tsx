import { Navigate, Route, Routes } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { BotsPage } from '@/pages/BotsPage'
import { CampaignsPage } from '@/pages/CampaignsPage'
import { CreateBotWizard } from '@/pages/CreateBotWizard'
import { FeedPage } from '@/pages/FeedPage'
import { MemoriesPage } from '@/pages/MemoriesPage'
import { CampaignCreatePage } from '@/pages/CampaignCreatePage'
import { BotTrainingPage } from '@/pages/BotTrainingPage'
import { Toaster } from 'sonner'
import { useTheme } from '@/providers/ThemeProvider'

export default function App() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors">
        <Toaster theme={theme} richColors />
        <Routes>
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/bots" element={<BotsPage />} />
          <Route path="/bots/new" element={<CreateBotWizard />} />
          <Route path="/bots/:botId/training" element={<BotTrainingPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/new" element={<CampaignCreatePage />} />
          <Route path="/memories" element={<MemoriesPage />} />
        </Routes>
      </main>
    </div>
  )
}
