import { createContext, useContext } from 'react'
import type { ResolvedExperience } from './experience'

export interface AssistantRuntime {
  toolActivity: ResolvedExperience['toolActivity']
  toolLabels: ResolvedExperience['toolLabels']
}

export const AssistantRuntimeContext = createContext<AssistantRuntime>({ toolActivity: 'steps', toolLabels: {} })

export const useAssistantRuntime = () => useContext(AssistantRuntimeContext)
