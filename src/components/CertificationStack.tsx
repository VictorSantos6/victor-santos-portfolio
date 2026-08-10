import { ArrowLeft, ArrowRight, ExternalLink, Orbit, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Certification } from '../types'

interface CertificationStackProps {
  items: Certification[]
  reducedMotion: boolean
}

export function CertificationStack({ items, reducedMotion }: CertificationStackProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selected, setSelected] = useState<Certification | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const lastTrigger = useRef<HTMLButtonElement | null>(null)

  const closeViewer = useCallback(() => {
    setSelected(null)
    window.setTimeout(() => lastTrigger.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!selected) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeViewer()
      if (event.key === 'Tab' && dialog.current) {
        const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button, a[href]'))
        if (!focusable.length) return
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
  }, [closeViewer, selected])

  if (!items.length) return null

  const selectPrevious = () => setActiveIndex((current) => (current - 1 + items.length) % items.length)
  const selectNext = () => setActiveIndex((current) => (current + 1) % items.length)
  const positionFor = (index: number) => {
    if (index === activeIndex) return 'is-active'
    if (index === (activeIndex - 1 + items.length) % items.length) return 'is-previous'
    if (index === (activeIndex + 1) % items.length) return 'is-next'
    return 'is-hidden'
  }

  return (
    <>
      <section
        className="learning-stack certification-stack reveal"
        aria-labelledby="certification-stack-title"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            selectPrevious()
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            selectNext()
          }
          if (event.key === 'Home') setActiveIndex(0)
          if (event.key === 'End') setActiveIndex(items.length - 1)
        }}
      >
        <div className="learning-stack-heading">
          <div>
            <p className="card-label">Certifications</p>
            <h3 id="certification-stack-title">Credentials in active orbit.</h3>
          </div>
          <p><span>{String(activeIndex + 1).padStart(2, '0')}</span> / {String(items.length).padStart(2, '0')}</p>
        </div>

        <div className={`learning-stack-deck${reducedMotion ? ' reduce-motion' : ''}`}>
          <div className="learning-orbit" aria-hidden="true"><span /></div>
          {items.map((item, index) => (
            <button
              className={`learning-stack-card accent-amber ${positionFor(index)}`}
              type="button"
              key={item.id}
              onClick={(event) => {
                setActiveIndex(index)
                lastTrigger.current = event.currentTarget
                setSelected(item)
              }}
              aria-label={`Open ${item.name} certificate`}
              aria-current={index === activeIndex ? 'true' : undefined}
              tabIndex={index === activeIndex ? 0 : -1}
            >
              <span className="learning-card-topline">
                <span className="learning-status"><Orbit size={14} aria-hidden="true" /> Verified credential</span>
                <span>{item.issued}</span>
              </span>
              <span className="learning-visual certification-thumbnail">
                <img src={`/certifications/${item.id}/image`} alt="" loading="lazy" />
                <span className="learning-card-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              </span>
              <span className="learning-kind">{item.issuer}</span>
              <strong>{item.name}</strong>
              <span className="learning-description">{item.detail}</span>
              <span className="learning-tags"><span>Credential ID {item.credentialId}</span><span>Open certificate</span></span>
            </button>
          ))}
        </div>

        {items.length > 1 && (
          <div className="learning-stack-controls">
            <button type="button" onClick={selectPrevious} aria-label="Previous certification"><ArrowLeft size={19} aria-hidden="true" /></button>
            <button type="button" onClick={selectNext} aria-label="Next certification"><ArrowRight size={19} aria-hidden="true" /></button>
          </div>
        )}
      </section>

      {selected && createPortal((
        <div className="certificate-viewer" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && closeViewer()}>
          <div ref={dialog} className="certificate-viewer-dialog" role="dialog" aria-modal="true" aria-labelledby="certificate-viewer-title">
            <header>
              <div><p className="card-label">{selected.issuer} · {selected.issued}</p><h2 id="certificate-viewer-title">{selected.name}</h2></div>
              <div className="certificate-viewer-actions">
                <a href={selected.verificationUrl} target="_blank" rel="noreferrer">Verify <ExternalLink size={16} aria-hidden="true" /></a>
                <button ref={closeButton} type="button" onClick={closeViewer} aria-label="Close certificate viewer"><X aria-hidden="true" /></button>
              </div>
            </header>
            <div className="certificate-viewer-canvas">
              <img src={`/certifications/${selected.id}/image`} alt={`${selected.name} certificate issued by ${selected.issuer}`} />
            </div>
          </div>
        </div>
      ), document.querySelector('.app-shell') ?? document.body)}
    </>
  )
}
