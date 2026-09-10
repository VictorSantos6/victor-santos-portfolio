import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useRef, useState } from 'react'

export function ProjectGallery({ images = [], name }: { images?: string[]; name: string }) {
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState<string[]>([])
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const photos = images.filter((src) => src.trim() && !failed.includes(src))
  if (!photos.length) return null
  const active = index % photos.length
  const move = (direction: number) => setIndex((active + direction + photos.length) % photos.length)

  return (
    <section className="project-gallery" aria-label={`${name} photos`} aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          move(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}>
      <div className="project-photo"
        onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY } }}
        onTouchCancel={() => { touchStart.current = null }}
        onTouchEnd={(event) => {
          const start = touchStart.current
          touchStart.current = null
          if (!start) return
          const dx = event.changedTouches[0].clientX - start.x
          const dy = event.changedTouches[0].clientY - start.y
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1)
        }}>
        <img key={photos[active]} src={photos[active]} alt={`${name} — photo ${active + 1}`} loading="lazy" decoding="async"
          onError={() => setFailed((current) => [...current, photos[active]])} />
      </div>
      {photos.length > 1 && <div className="project-gallery-controls">
        <button type="button" onClick={() => move(-1)} aria-label={`Previous photo of ${name}`}><ArrowLeft size={18} aria-hidden="true" /></button>
        <span aria-live="polite" aria-atomic="true">{String(active + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>
        <button type="button" onClick={() => move(1)} aria-label={`Next photo of ${name}`}><ArrowRight size={18} aria-hidden="true" /></button>
      </div>}
    </section>
  )
}
