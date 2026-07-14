import { Check, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Project } from '../types'

interface ProjectDialogProps {
  project: Project | null
  onClose: () => void
}

export function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!project) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()

      if (event.key === 'Tab' && dialog.current) {
        const focusable = Array.from(
          dialog.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])'),
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, project])

  if (!project) return null

  return (
    <div
      className="project-modal"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div
        ref={dialog}
        className={`project-dialog accent-${project.accent}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-dialog-title"
        aria-describedby="project-dialog-description"
      >
        <div className="dialog-orbit" aria-hidden="true" />
        <header className="dialog-header">
          <div>
            <p className="signal-label">{project.signal}</p>
            <h2 id="project-dialog-title">{project.name}</h2>
          </div>
          <button ref={closeButton} className="icon-button" type="button" onClick={onClose} aria-label="Close project details">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="dialog-meta">
          <span>{project.period}</span>
          <span>{project.stack.join(' · ')}</span>
        </div>

        <div className="dialog-grid" id="project-dialog-description">
          <section>
            <p className="mini-label">The challenge</p>
            <p>{project.problem}</p>
          </section>
          <section>
            <p className="mini-label">My contribution</p>
            <p>{project.contribution}</p>
          </section>
        </div>

        <section className="outcomes-panel">
          <p className="mini-label">System outcomes</p>
          <ul>
            {project.outcomes.map((outcome) => (
              <li key={outcome}>
                <Check size={16} aria-hidden="true" />
                {outcome}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
