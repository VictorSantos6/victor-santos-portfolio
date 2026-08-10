import { ArrowLeft, ArrowRight, Orbit } from 'lucide-react'
import { useState } from 'react'

export interface LearningStackItem {
  id: string
  status: string
  kind: string
  title: string
  organization: string
  period: string
  description: string
  tags: string[]
  accent: 'cyan' | 'blue' | 'amber'
}

interface LearningStackProps {
  items: LearningStackItem[]
  reducedMotion: boolean
}

export function LearningStack({ items, reducedMotion }: LearningStackProps) {
  const [activeIndex, setActiveIndex] = useState(0)

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
    <section
      className="learning-stack reveal"
      aria-labelledby="learning-stack-title"
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
          <p className="card-label">Learning & credentials</p>
          <h3 id="learning-stack-title">Knowledge in active orbit.</h3>
        </div>
        <p><span>{String(activeIndex + 1).padStart(2, '0')}</span> / {String(items.length).padStart(2, '0')}</p>
      </div>

      <div className={`learning-stack-deck${reducedMotion ? ' reduce-motion' : ''}`}>
        <div className="learning-orbit" aria-hidden="true"><span /></div>
        {items.map((item, index) => (
          <button
            className={`learning-stack-card accent-${item.accent} ${positionFor(index)}`}
            type="button"
            key={item.id}
            onClick={() => setActiveIndex(index)}
            aria-label={`${item.title}, ${item.status}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            tabIndex={index === activeIndex ? 0 : -1}
          >
            <span className="learning-card-topline">
              <span className="learning-status"><Orbit size={14} aria-hidden="true" /> {item.status}</span>
              <span>{item.period}</span>
            </span>
            <span className="learning-visual" aria-hidden="true">
              <span className="learning-planet" />
              <span className="learning-flight-path" />
              <span className="learning-card-number">{String(index + 1).padStart(2, '0')}</span>
            </span>
            <span className="learning-kind">{item.kind} · {item.organization}</span>
            <strong>{item.title}</strong>
            <span className="learning-description">{item.description}</span>
            <span className="learning-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</span>
          </button>
        ))}
      </div>

      <div className="learning-stack-controls">
        <button type="button" onClick={selectPrevious} aria-label="Previous learning card"><ArrowLeft size={19} aria-hidden="true" /></button>
        <button type="button" onClick={selectNext} aria-label="Next learning card"><ArrowRight size={19} aria-hidden="true" /></button>
      </div>
    </section>
  )
}
