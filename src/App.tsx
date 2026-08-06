import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  ContactRound,
  Download,
  ExternalLink,
  Mail,
  Orbit,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'
import { ProjectDialog } from './components/ProjectDialog'
import { defaultPortfolio } from './data/portfolio'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useWebGL } from './hooks/useWebGL'
import { sectionThemes, themeCssVariables } from './theme'
import type { SectionId, ThemeCSSProperties } from './theme'
import type { PortfolioContent, Project } from './types'

const SpaceScene = lazy(() => import('./components/SpaceScene'))

const navigationItems = [
  { id: 'top', label: 'Intro' },
  { id: 'profile', label: 'Profile' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
] as const

function GitHubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 19 19" aria-hidden="true">
      <use href="/icons.svg#github-icon" />
    </svg>
  )
}

function projectFromHash(projects: Project[]): Project | null {
  const id = window.location.hash.replace('#project-', '')
  return projects.find((project) => project.id === id) ?? null
}

interface AppProps {
  initialContent?: PortfolioContent
  loadPublished?: boolean
  preview?: boolean
  onExitPreview?: () => void
}

function App({ initialContent = defaultPortfolio, loadPublished = false, preview = false, onExitPreview }: AppProps) {
  const reducedMotion = useReducedMotion()
  const webGLSupported = useWebGL()
  const [portfolio, setPortfolio] = useState(initialContent)
  const scrollProgress = useRef(0)
  const [activeSection, setActiveSection] = useState<SectionId>('top')
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => projectFromHash(initialContent.projects))
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 720px)').matches)
  const appShell = useRef<HTMLDivElement>(null)
  const previousSection = useRef<SectionId>('top')
  const navigationTarget = useRef<SectionId | null>(null)
  const scrollTween = useRef<gsap.core.Tween | null>(null)
  const lastTrigger = useRef<HTMLButtonElement | null>(null)
  const lastBrandActivation = useRef(0)
  const activeTheme = sectionThemes[activeSection]
  const { contact, education, experiences, projects, skillGroups } = portfolio

  useEffect(() => {
    if (!loadPublished || typeof fetch !== 'function') return
    const controller = new AbortController()
    fetch('/api/portfolio', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Portfolio unavailable')))
      .then((content: PortfolioContent) => setPortfolio(content))
      .catch(() => undefined)
    return () => controller.abort()
  }, [loadPublished])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const syncHash = () => setSelectedProject(projectFromHash(projects))
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [projects])

  useEffect(() => {
    setSelectedProject((current) => {
      const hashProject = projectFromHash(projects)
      if (hashProject) return hashProject
      if (!current) return null
      return projects.find((project) => project.id === current.id) ?? null
    })
  }, [projects])

  useEffect(() => {
    const releaseNavigationTarget = () => {
      scrollTween.current?.kill()
      scrollTween.current = null
      navigationTarget.current = null
    }
    const releaseOnKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' '].includes(event.key)) releaseNavigationTarget()
    }
    window.addEventListener('wheel', releaseNavigationTarget, { passive: true })
    window.addEventListener('touchstart', releaseNavigationTarget, { passive: true })
    window.addEventListener('keydown', releaseOnKey)
    return () => {
      releaseNavigationTarget()
      window.removeEventListener('wheel', releaseNavigationTarget)
      window.removeEventListener('touchstart', releaseNavigationTarget)
      window.removeEventListener('keydown', releaseOnKey)
    }
  }, [])

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const context = gsap.context(() => {
      if (!reducedMotion) {
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
          gsap.fromTo(element, { opacity: 0, y: 14 }, {
            opacity: 1,
            y: 0,
            duration: 0.24,
            ease: 'power2.out',
            scrollTrigger: { trigger: element, start: 'top 90%', toggleActions: 'play none none none', once: true },
          })
        })
      }
      ScrollTrigger.create({
        trigger: '#main-content',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          scrollProgress.current = self.progress
          appShell.current?.style.setProperty('--scroll-progress', `${self.progress * 100}%`)
        },
      })
      navigationItems.forEach(({ id }) => {
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: 'top center',
          end: 'bottom center',
          onToggle: (self) => {
            if (self.isActive && !navigationTarget.current) setActiveSection(id)
          },
        })
      })
    })
    return () => context.revert()
  }, [reducedMotion])

  useLayoutEffect(() => {
    const shell = appShell.current
    if (!shell) return
    const variables = themeCssVariables(activeTheme)
    const sectionChanged = previousSection.current !== activeSection
    gsap.killTweensOf(shell)
    if (reducedMotion) gsap.set(shell, variables)
    else gsap.to(shell, { ...variables, duration: sectionChanged ? 0.28 : 0, ease: 'power2.out', overwrite: true })
    previousSection.current = activeSection
    return () => gsap.killTweensOf(shell)
  }, [activeSection, activeTheme, reducedMotion])

  const handleSectionNavigation = useCallback((event: React.MouseEvent<HTMLAnchorElement>, section: SectionId) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const destination = document.getElementById(section)
    if (!destination) return
    event.preventDefault()
    scrollTween.current?.kill()
    navigationTarget.current = section
    setActiveSection(section)
    window.history.pushState(null, '', `#${section}`)
    const startY = window.scrollY
    const scrollMargin = Number.parseFloat(window.getComputedStyle(destination).scrollMarginTop) || 0
    const targetY = Math.max(0, startY + destination.getBoundingClientRect().top - scrollMargin)
    if (reducedMotion) {
      window.scrollTo({ top: targetY, behavior: 'auto' })
      navigationTarget.current = null
      return
    }
    const position = { y: startY }
    const viewportDistance = Math.abs(targetY - startY) / Math.max(window.innerHeight, 1)
    const duration = gsap.utils.clamp(0.34, 0.52, 0.32 + viewportDistance * 0.035)
    let tween: gsap.core.Tween
    tween = gsap.to(position, {
      y: targetY,
      duration,
      ease: 'power3.inOut',
      overwrite: true,
      onUpdate: () => window.scrollTo(0, position.y),
      onComplete: () => {
        if (scrollTween.current === tween) {
          scrollTween.current = null
          navigationTarget.current = null
        }
      },
      onInterrupt: () => {
        if (scrollTween.current === tween) {
          scrollTween.current = null
          navigationTarget.current = null
        }
      },
    })
    scrollTween.current = tween
  }, [reducedMotion])

  const openProject = (project: Project, trigger: HTMLButtonElement) => {
    lastTrigger.current = trigger
    setSelectedProject(project)
    window.history.pushState(null, '', `#project-${project.id}`)
  }
  const closeProject = useCallback(() => {
    setSelectedProject(null)
    window.history.replaceState(null, '', '#projects')
    window.setTimeout(() => lastTrigger.current?.focus(), 0)
  }, [])
  const handleBrandActivation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now()
    if (now - lastBrandActivation.current <= 500) {
      event.preventDefault()
      lastBrandActivation.current = 0
      window.history.pushState(null, '', '/admin')
      window.dispatchEvent(new Event('portfolio:navigate'))
      return
    }
    lastBrandActivation.current = now
    handleSectionNavigation(event, 'top')
  }

  const progressStyle: ThemeCSSProperties = { ...themeCssVariables(sectionThemes.top), '--scroll-progress': '0%' }

  return (
    <div className="app-shell" data-planet={activeTheme.planet.variant} data-section={activeSection} ref={appShell} style={progressStyle}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {preview && <div className="preview-bar" role="status"><span>Draft preview</span><button type="button" onClick={onExitPreview}>Back to editor</button></div>}

      <div className="space-backdrop" aria-hidden="true">
        {webGLSupported ? (
          <Suspense fallback={<div className="scene-loader"><span /></div>}>
            <SpaceScene progress={scrollProgress} activeProjectId={selectedProject?.id ?? null} activeSection={activeSection} theme={activeTheme} reducedMotion={reducedMotion} mobile={mobile} />
          </Suspense>
        ) : <div className="css-space-fallback" />}
      </div>
      <div className="noise-layer" aria-hidden="true" />

      <header className={`site-header site-header--${activeSection === 'top' ? 'hero' : 'interior'}`}>
        <a className="brand" href="#top" aria-label={`${portfolio.identity.name}, back to top`} onClick={handleBrandActivation}>
          <span className="brand-mark">VS</span>
          <span className="brand-copy"><strong>{portfolio.identity.name}</strong><small>{portfolio.identity.role}</small></span>
        </a>
        <nav aria-label="Primary navigation">
          {navigationItems.map(({ id, label }) => (
            <a className={id === 'contact' ? 'nav-contact' : undefined} href={`#${id}`} key={id} aria-current={activeSection === id ? 'location' : undefined} onClick={(event) => handleSectionNavigation(event, id)}>{label}</a>
          ))}
        </nav>
      </header>

      <main id="main-content">
        <section className="hero chapter" id="top" aria-labelledby="hero-title">
          <div className="hero-grid">
            <div className="hero-copy reveal">
              <p className="eyebrow">{portfolio.identity.kicker}</p>
              <h1 id="hero-title">{portfolio.identity.name}</h1>
              <p className="hero-statement">{portfolio.identity.headlineLead} <span>{portfolio.identity.headlineMiddle}</span> <em>{portfolio.identity.headlineEmphasis}</em></p>
              <p className="hero-summary">{portfolio.identity.summary}</p>
              <div className="hero-actions">
                <a className="primary-button" href="#projects" onClick={(event) => handleSectionNavigation(event, 'projects')}>View my projects <ArrowRight size={18} aria-hidden="true" /></a>
                <a className="text-link" href="/resume" download={contact.resumeName}><Download size={17} aria-hidden="true" /> Download résumé</a>
              </div>
            </div>
            <aside className="currently-card reveal" aria-label="Current details">
              <span className="orbit-signal" aria-hidden="true" />
              <p className="card-label">Currently</p>
              <dl>
                <div><dt>Working on</dt><dd>{portfolio.identity.building}</dd></div>
                <div><dt>Looking for</dt><dd>{portfolio.identity.status}</dd></div>
                <div><dt>Graduating</dt><dd>{education.graduation}</dd></div>
              </dl>
            </aside>
          </div>
          <a className="scroll-cue" href="#profile" onClick={(event) => handleSectionNavigation(event, 'profile')}>More about me <ArrowDown size={16} aria-hidden="true" /></a>
        </section>

        <section className="profile-section chapter" id="profile" aria-labelledby="profile-title">
          <div className="section-heading reveal"><p className="eyebrow">01 · About me</p><h2 id="profile-title">What I’m learning and using now.</h2></div>
          <div className="profile-grid">
            <article className="content-card education-card reveal">
              <BookOpen className="card-icon" aria-hidden="true" />
              <p className="card-label">Education</p><h3>{education.institution}</h3><p>{education.degree}</p>
              <div className="education-meta"><span>{education.location}</span><span>Graduating {education.graduation}</span></div>
            </article>
            <article className="content-card gpa-card reveal"><p className="card-label">Current GPA</p><strong>{education.gpa}</strong></article>
            <article className="content-card course-card reveal"><p className="card-label">Relevant coursework</p><ul>{education.coursework.map((course) => <li key={course}>{course}</li>)}</ul></article>
            <article className="content-card skills-card reveal"><p className="card-label">Tools and skills</p>{skillGroups.map((group) => <div className="skill-group" key={group.label}><h3>{group.label}</h3><p>{group.skills.join(' · ')}</p></div>)}</article>
          </div>
        </section>

        <section className="experience-section chapter" id="experience" aria-labelledby="experience-title">
          <div className="section-heading section-heading--right reveal"><p className="eyebrow">02 · Experience</p><h2 id="experience-title">Work I’ve done so far.</h2></div>
          <div className="experience-list">
            {experiences.map((experience) => (
              <article className={`experience-card reveal ${experience.featured ? 'featured' : ''}`} key={experience.id}>
                <div className="experience-header"><div><p className="card-label">{experience.eyebrow}</p><h3>{experience.organization}</h3></div><p>{experience.period}</p></div>
                <div className="experience-body">
                  <div><p className="field-label">Role</p><p>{experience.role} · {experience.location}</p></div>
                  <div><p className="field-label">What I worked on</p><p>{experience.summary}</p></div>
                  <div><p className="field-label">Outcomes</p><ul>{experience.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></div>
                </div>
                {experience.impact?.length ? <div className="impact-row" aria-label="LiDRON engineering impact">{experience.impact.map((impact) => <div key={`${impact.value}-${impact.label}`}><strong>{impact.value}</strong><span>{impact.label}</span></div>)}</div> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="projects-section chapter" id="projects" aria-labelledby="projects-title">
          <div className="section-heading reveal"><p className="eyebrow">03 · Selected projects</p><h2 id="projects-title">Things I’ve built while learning.</h2></div>
          <div className="project-grid">
            {projects.map((project) => (
              <button className={`project-card accent-${project.accent} reveal`} id={`case-${project.id}`} type="button" key={project.id} onClick={(event) => openProject(project, event.currentTarget)} aria-haspopup="dialog">
                <span className="project-heading"><span className="project-category">{project.signal.split('/')[1]?.trim()}</span><span>{project.period}</span></span>
                <strong>{project.name}</strong>
                <span className="project-stack">{project.stack.join(' · ')}</span>
                <span className="project-field"><b>Problem</b>{project.problem}</span>
                <span className="project-field"><b>My role</b>{project.contribution}</span>
                <span className="project-outcome"><b>Outcome</b>{project.outcomes[0]}</span>
                <span className="project-open">View full project <ArrowRight size={16} aria-hidden="true" /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="contact-section chapter" id="contact" aria-labelledby="contact-title">
          <div className="contact-card reveal"><p className="eyebrow">04 · Get in touch</p><h2 id="contact-title">Want to work together?</h2><p>{contact.intro}</p><div className="contact-actions"><a className="primary-button" href={`mailto:${contact.email}`}><Mail size={18} aria-hidden="true" /> Email me</a><a className="contact-link" href={contact.linkedin} target="_blank" rel="noreferrer"><ContactRound size={18} aria-hidden="true" /> LinkedIn <ExternalLink size={14} aria-hidden="true" /></a><a className="contact-link" href={contact.github ?? defaultPortfolio.contact.github} target="_blank" rel="noreferrer"><GitHubMark /> GitHub <ExternalLink size={14} aria-hidden="true" /></a></div><a className="email-display" href={`mailto:${contact.email}`}>{contact.email}</a></div>
        </section>
      </main>

      <footer><div className="footer-mark"><Orbit aria-hidden="true" /> VS / 2026</div><p>Designed and engineered in {portfolio.identity.location}.</p><div className="footer-status"><span /> {portfolio.identity.status}</div></footer>
      <ProjectDialog project={selectedProject} onClose={closeProject} reducedMotion={reducedMotion} />
    </div>
  )
}

export default App
