// Shim that exposes a cloud-style module-level API surface backed by the
// per-instance DistriHomeClient registered through DistriHomeProvider.
// The workspace-editor files were copied verbatim from cloud and import
// from `../lib/api` / `../../lib/api`. This shim translates those calls
// onto the OSS client without modifying the verbatim sources.
//
// Wire-up: DistriHomeProvider calls `setApiHomeClient(config.homeClient)`
// on mount/update so the singleton is populated before any route renders.

import type {
  DistriHomeClient,
  PromptTemplate,
  SkillRecord,
  NewSkill,
  UpdateSkill,
} from '../DistriHomeClient'

let _client: DistriHomeClient | null = null

/// Bind the singleton home client. Called by DistriHomeProvider.
export function setApiHomeClient(c: DistriHomeClient | null) {
  _client = c
}

function client(): DistriHomeClient {
  if (!_client) {
    throw new Error('lib/api not initialized — wrap with DistriHomeProvider')
  }
  return _client
}

// ---- Agents ----

export async function listAgents(): Promise<unknown[]> {
  return client().listAgents()
}

export async function getAgent(name: string): Promise<unknown> {
  return client().getAgent(name)
}

export async function deleteAgent(name: string): Promise<void> {
  return client().deleteAgent(name)
}

export async function registerAgentMarkdown(markdown: string): Promise<unknown> {
  return client().registerAgentMarkdown(markdown)
}

export async function cloneAgent(name: string): Promise<void> {
  return client().cloneAgent(name)
}

// ---- Skills ----
//
// Cloud's listSkills returns `{ skills: SkillListItem[] }`. OSS's
// DistriHomeClient.listSkills returns `SkillRecord[]` directly. The shim
// rewraps so cloud's WorkspacePage code can be byte-identical.

export type Skill = SkillRecord
export type ListSkillsOptions = { scope?: string; search?: string; page?: number; per_page?: number }

export async function listSkills(_options?: ListSkillsOptions): Promise<{ skills: SkillRecord[] }> {
  const rows = await client().listSkills()
  return { skills: rows }
}

export async function getSkill(id: string): Promise<SkillRecord> {
  return client().getSkill(id)
}

export async function createSkill(skill: NewSkill): Promise<SkillRecord> {
  return client().createSkill(skill)
}

export async function updateSkill(id: string, updates: UpdateSkill): Promise<SkillRecord> {
  return client().updateSkill(id, updates)
}

export async function deleteSkill(id: string): Promise<void> {
  return client().deleteSkill(id)
}

// ---- Prompt templates ----

export type { PromptTemplate }

export async function listPromptTemplates(): Promise<PromptTemplate[]> {
  return client().listPromptTemplates()
}

/// Create-or-update a prompt template by name.
/// Used by the workspace editor's Save button so an edit doesn't require
/// the caller to know whether the template was already created.
export async function upsertPromptTemplate(body: {
  name: string
  template: string
}): Promise<PromptTemplate> {
  const list = await listPromptTemplates().catch(() => [] as PromptTemplate[])
  const existing = list.find((t) => t.name === body.name)
  if (existing) {
    return client().updatePromptTemplate(existing.id, body.name, body.template)
  }
  return client().createPromptTemplate(body.name, body.template)
}

export async function deletePromptTemplate(id: string): Promise<void> {
  return client().deletePromptTemplate(id)
}

// ---- AgentConfig type re-export (cloud surfaces this from lib/api). ----
// Cloud has a richer AgentConfig type; OSS doesn't model it here, so
// expose `unknown` aliased to match the import shape.
export type AgentConfig = unknown
