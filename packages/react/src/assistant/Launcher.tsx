import React from 'react'
import { MessageCircle, X } from 'lucide-react'

/** The floating round button that opens and closes the panel. */
export const Launcher: React.FC<{ open: boolean; onToggle: () => void; label: string }> = ({ open, onToggle, label }) => (
  <button
    type="button"
    className="dui-launcher"
    aria-label={open ? `Close ${label}` : `Open ${label}`}
    aria-expanded={open}
    onClick={onToggle}
  >
    {open ? <X aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
  </button>
)
