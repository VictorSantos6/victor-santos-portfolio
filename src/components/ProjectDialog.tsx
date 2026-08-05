import { Check, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Project } from '../types'

interface ProjectDialogProps {
  project: Project | null
  onClose: () => void
  reducedMotion: boolean
}

export function ProjectDialog({ project, onClose, reducedMotion }: ProjectDialogProps) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)
  const closeTimer = useRef<number | null>(null)
  const [closing, setClosing] = useState(false)

  const finishClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    onClose()
  }, [onClose])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    if (reducedMotion) {
      finishClose()
      return
    }

    closingRef.current = true
    setClosing(true)
    closeTimer.current = window.setTimeout(finishClose, 180)
  }, [finishClose, reducedMotion])

  useEffect(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    closeTimer.current = null
    closingRef.current = false
    setClosing(false)
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [project?.id])

  useEffect(() => {
    if (!project) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()

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
  }, [project, requestClose])

  if (!project) return null

  return (
    <div
      className={`project-modal${closing ? ' is-closing' : ''}`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) requestClose()
      }}
      onAnimationEnd={(event) => {
        if (closing && event.currentTarget === event.target) finishClose()
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
        <header className="dialog-header">
          <div>
            <p className="signal-label">{project.signal.split('/')[1]?.trim()}</p>
            <h2 id="project-dialog-title">{project.name}</h2>
          </div>
          <button ref={closeButton} className="icon-button" type="button" onClick={requestClose} aria-label="Close project details">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="dialog-meta">
          <span>{project.period}</span>
          <span>{project.stack.join(' · ')}</span>
        </div>

        <div className="dialog-grid" id="project-dialog-description">
          <section>
            <p className="mini-label">Problem</p>
            <p>{project.problem}</p>
          </section>
          <section>
            <p className="mini-label">My role</p>
            <p>{project.contribution}</p>
          </section>
        </div>

        <section className="outcomes-panel">
          <p className="mini-label">Outcomes</p>
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
