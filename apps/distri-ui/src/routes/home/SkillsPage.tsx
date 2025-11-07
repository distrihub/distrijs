import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/ui/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BACKEND_URL } from '@/constants'
import { useInitialization } from '@/components/TokenProvider'
import { toast } from 'sonner'
import { Sparkles, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SkillSummary {
  id: string
  name: string
  description: string
  version?: string | null
  tags: string[]
  updated_at: string
}

const API_BASE_URL = `${BACKEND_URL}/api/v1`

const SkillsPage = () => {
  const navigate = useNavigate()
  const { token } = useInitialization()
  const [skills, setSkills] = useState<SkillSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillDescription, setNewSkillDescription] = useState('')

  const headers = useMemo(() => {
    const base: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) {
      base.Authorization = `Bearer ${token}`
    }
    return base
  }, [token])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/skills`, { headers })
        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Failed to load skills')
        }
        const data = await response.json()
        setSkills(Array.isArray(data.skills) ? data.skills : [])
      } catch (err) {
        console.error(err)
        toast.error(err instanceof Error ? err.message : 'Failed to load skills')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [headers])

  const handleCreateSkill = async () => {
    const name = newSkillName.trim()
    if (!name) {
      toast.error('Please provide a name for the new skill')
      return
    }
    setCreating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/skills`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description: newSkillDescription.trim() }),
      })
      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to create skill')
      }
      const skill = await response.json()
      toast.success('Skill created')
      setDialogOpen(false)
      setNewSkillName('')
      setNewSkillDescription('')
      navigate(`/home/skills/${encodeURIComponent(skill.id)}`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to create skill')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[520px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Skills"
        subtitle={
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Manage distri skills backed by the plugin catalog.
          </span>
        }
        rightElement={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New skill
          </Button>
        }
      />

      <div className="flex-1 overflow-auto px-4 pb-6">
        {skills.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
            <p>No skills found yet. Create one to get started.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create a skill
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => {
              const updatedLabel = formatDistanceToNow(new Date(skill.updated_at), { addSuffix: true })
              return (
                <Card
                  key={skill.id}
                  className="group cursor-pointer border-border transition hover:border-primary/20 hover:shadow-lg"
                  onClick={() => navigate(`/home/skills/${encodeURIComponent(skill.id)}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{skill.name}</h3>
                          <p className="text-xs text-muted-foreground">Updated {updatedLabel}</p>
                        </div>
                        <Badge variant="outline">v{skill.version ?? '0.1.0'}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{skill.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-2">
                        {skill.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !creating && setDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-skill-name">Name</Label>
              <Input
                id="new-skill-name"
                value={newSkillName}
                placeholder="Customer onboarding skill"
                onChange={(event) => setNewSkillName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-skill-description">Description</Label>
              <Textarea
                id="new-skill-description"
                value={newSkillDescription}
                onChange={(event) => setNewSkillDescription(event.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateSkill} disabled={creating}>
              {creating ? 'Creating…' : 'Create skill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SkillsPage
