// PageHeader — single shared top nav slot system.
//
// AppLayout renders ONE nav bar at the top and exposes two slot targets
// (left + right). Pages push their own contextual actions into those
// slots via <PageHeaderSlot side="left|right">. The Distri toggle (and
// any other permanent layout-level controls) sits next to the slots.
// Pages don't render their own duplicate top bar.
//
// Implementation: callback-ref-based portals. AppLayout mounts target
// `<div>`s and stores their nodes in context state. PageHeaderSlot
// portals its children into whichever node matches `side`, mounting
// only after the target is registered (so race-on-first-render is
// fine — slot just no-ops until the target callback ref fires).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type Targets = {
  left: HTMLDivElement | null
  right: HTMLDivElement | null
}

type Ctx = {
  targets: Targets
  setLeft: (el: HTMLDivElement | null) => void
  setRight: (el: HTMLDivElement | null) => void
}

const PageHeaderContext = createContext<Ctx | null>(null)

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState<Targets>({ left: null, right: null })
  const setLeft = useCallback(
    (el: HTMLDivElement | null) => setTargets((t) => (t.left === el ? t : { ...t, left: el })),
    [],
  )
  const setRight = useCallback(
    (el: HTMLDivElement | null) => setTargets((t) => (t.right === el ? t : { ...t, right: el })),
    [],
  )
  const value = useMemo<Ctx>(() => ({ targets, setLeft, setRight }), [targets, setLeft, setRight])
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>
}

function usePageHeader(): Ctx {
  const ctx = useContext(PageHeaderContext)
  if (!ctx) throw new Error('PageHeaderSlot/Target must be inside PageHeaderProvider')
  return ctx
}

/// Renders the slot target for `side` into AppLayout's nav bar. Pages
/// don't render this — only AppLayout does.
export function PageHeaderTarget({
  side,
  className,
}: {
  side: 'left' | 'right'
  className?: string
}) {
  const { setLeft, setRight } = usePageHeader()
  const ref = side === 'left' ? setLeft : setRight
  return <div ref={ref} className={className} />
}

/// Pages render <PageHeaderSlot side="…">{actions}</PageHeaderSlot> to
/// inject their context-specific controls into the single top nav.
export function PageHeaderSlot({
  side,
  children,
}: {
  side: 'left' | 'right'
  children: ReactNode
}) {
  const { targets } = usePageHeader()
  const target = side === 'left' ? targets.left : targets.right
  if (!target) return null
  return createPortal(children, target)
}
