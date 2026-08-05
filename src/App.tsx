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

function App({
  initialContent = defaultPortfolio,
  loadPublished = true,
  preview = false,
  onExitPreview,
}: AppProps) {
  const reducedMotion = useReducedMotion()
  const webGLSupported = useWebGL()
  const [portfolio, setPortfolio] = useState(initialContent)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSection, setActiveSection] = useState<SectionId>('top')
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => projectFromHash(initialContent.projects))
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 720px)').matches)
  const appShell = useRef<HTMLDivElement>(null)
  const previousSection = useRef<SectionId>('top')
  const navigationTarget = useRef<SectionId | null>(null)
  const navigationReleaseTimer = useRef<number | null>(null)
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
      navigationTarget.current = null
      if (navigationReleaseTimer.current !== null) {
        window.clearTimeout(navigationReleaseTimer.current)
        navigationReleaseTimer.current = null
      }
    }
    const releaseOnKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' '].includes(event.key)) {
        releaseNavigationTarget()
      }
    }

    window.addEventListener('scrollend', releaseNavigationTarget)
    window.addEventListener('wheel', releaseNavigationTarget, { passive: true })
    window.addEventListener('touchstart', releaseNavigationTarget, { passive: true })
    window.addEventListener('keydown', releaseOnKey)

    return () => {
      releaseNavigationTarget()
      window.removeEventListener('scrollend', releaseNavigationTarget)
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
          gsap.fromTo(
            element,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.38,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 90%',
                toggleActions: 'play none none none',
                once: true,
              },
            },
          )
        })
      }

      ScrollTrigger.create({
        trigger: '#main-content',
        start: 'top top',
        end: 'bottom bottom',
        scrub: reducedMotion ? false : 0.4,
        onUpdate: (self) => setScrollProgress(self.progress),
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

    if (reducedMotion) {
      gsap.set(shell, variables)
    } else {
      gsap.to(shell, {
        ...variables,
        duration: sectionChanged ? 0.38 : 0,
        ease: 'power2.out',
        overwrite: true,
      })

    }

    previousSection.current = activeSection

    return () => {
      gsap.killTweensOf(shell)
    }
  }, [activeSection, activeTheme, reducedMotion])

  const handleSectionNavigation = useCallback((
    event: React.MouseEvent<HTMLAnchorElement>,
    section: SectionId,
  ) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const destination = document.getElementById(section)
    if (!destination) return

    event.preventDefault()
    navigationTarget.current = section
    setActiveSection(section)
    window.history.pushState(null, '', `#${section}`)
    destination.scrollIntoView?.({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })

    if (navigationReleaseTimer.current !== null) {
      window.clearTimeout(navigationReleaseTimer.current)
    }
    navigationReleaseTimer.current = window.setTimeout(() => {
      navigationTarget.current = null
      navigationReleaseTimer.current = null
    }, reducedMotion ? 0 : 1400)
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

  const progressStyle: ThemeCSSProperties = {
    ...themeCssVariables(sectionThemes.top),
    '--scroll-progress': `${scrollProgress * 100}%`,
  }

  return (
    <div
      className="app-shell"
      data-planet={activeTheme.planet.variant}
      data-section={activeSection}
      ref={appShell}
      style={progressStyle}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {preview && (
        <div className="preview-bar" role="status">
          <span>Draft preview</span>
          <button type="button" onClick={onExitPreview}>Back to editor</button>
        </div>
      )}

      <div className="space-backdrop" aria-hidden="true">
        {webGLSupported ? (
          <Suspense fallback={<div className="scene-loader"><span /></div>}>
            <SpaceScene
              progress={scrollProgress}
              activeProjectId={selectedProject?.id ?? null}
              activeSection={activeSection}
              theme={activeTheme}
              reducedMotion={reducedMotion}
              mobile={mobile}
            />
          </Suspense>
        ) : (
          <div className="css-space-fallback" />
        )}
      </div>

      <div className="noise-layer" aria-hidden="true" />

      <header className={`site-header site-header--${activeSection === 'top' ? 'hero' : 'interior'}`}>
        <a className="brand" href="#top" aria-label={`${portfolio.identity.name}, back to top`} onClick={handleBrandActivation}>
          <span className="brand-mark">VS</span>
          <span className="brand-copy">
            <strong>{portfolio.identity.name}</strong>
            <small>{portfolio.identity.role}</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          {navigationItems.map(({ id, label }) => {
            const isActive = activeSection === id

            return (
              <a
                className={id === 'contact' ? 'nav-contact' : undefined}
                href={`#${id}`}
                key={id}
                aria-current={isActive ? 'location' : undefined}
                onClick={(event) => handleSectionNavigation(event, id)}
              >
                <span className="nav-active-dot" aria-hidden="true" />
                <span>{label}</span>
              </a>
            )
          })}
        </nav>
      </header>

      <aside className="mission-rail" aria-hidden="true">
        <span>00</span>
        <div className="rail-track"><div className="rail-fill" /></div>
        <span>05</span>
      </aside>

      <main id="main-content">
        <section className="hero chapter" id="top" aria-labelledby="hero-title">
          <div className="hero-grid">
            <div className="hero-kicker reveal">
              <span className="live-dot" />
              {portfolio.identity.kicker}
            </div>

            <div className="hero-copy reveal">
              <p className="chapter-index">00 — Introduction</p>
              <h1 id="hero-title">
                {portfolio.identity.headlineLead}
                <span>{portfolio.identity.headlineMiddle}</span>
                <em>{portfolio.identity.headlineEmphasis}</em>
              </h1>
              <p className="hero-summary">
                {portfolio.identity.summary}
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="#projects" onClick={(event) => handleSectionNavigation(event, 'projects')}>
                  View my projects <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a className="text-link" href="/resume" download={contact.resumeName}>
                  <Download size={17} aria-hidden="true" /> Download résumé
                </a>
              </div>
            </div>

            <div className="hero-telemetry reveal" aria-label="Current details">
              <div>
                <span>Building</span>
                <strong>{portfolio.identity.building}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{portfolio.identity.status}</strong>
              </div>
              <div>
                <span>Graduation</span>
                <strong>May 2028</strong>
              </div>
            </div>
          </div>

          <a className="scroll-cue" href="#profile" onClick={(event) => handleSectionNavigation(event, 'profile')}>
            <span>More about me</span>
            <ArrowDown size={16} aria-hidden="true" />
          </a>
        </section>

        <section className="profile-section chapter" id="profile" aria-labelledby="profile-title">
          <div className="section-heading reveal">
            <p className="chapter-index">01 — About me</p>
            <h2 id="profile-title">What I’m learning<br />and using now.</h2>
          </div>

          <div className="profile-orbit">
            <article className="education-card glass-panel reveal">
              <div className="panel-icon"><BookOpen aria-hidden="true" /></div>
              <p className="mini-label">Education</p>
              <h3>{education.institution}</h3>
              <p>{education.degree}</p>
              <div className="education-meta">
                <span>{education.location}</span>
                <span>Graduating {education.graduation}</span>
              </div>
            </article>

            <article className="gpa-card telemetry-card reveal">
              <span>General GPA</span>
              <strong>{education.gpa}</strong>
              <small>Current GPA</small>
            </article>

            <article className="course-card glass-panel reveal">
              <p className="mini-label">Coursework</p>
              <ul>
                {education.coursework.map((course, index) => (
                  <li key={course}><span>0{index + 1}</span>{course}</li>
                ))}
              </ul>
            </article>

            <article className="skills-orbit glass-panel reveal">
              <p className="mini-label">Tools and skills</p>
              {skillGroups.map((group) => (
                <div className="skill-group" key={group.label}>
                  <p>{group.label}</p>
                  <div>
                    {group.skills.map((skill) => <span key={skill}>{skill}</span>)}
                  </div>
                </div>
              ))}
            </article>
          </div>
        </section>

        <section className="experience-section chapter" id="experience" aria-labelledby="experience-title">
          <div className="section-heading align-right reveal">
            <p className="chapter-index">02 — Experience</p>
            <h2 id="experience-title">Work I’ve done<br />so far.</h2>
            <p className="section-deck">{portfolio.experienceIntro}</p>
          </div>

          <div className="mission-stack">
            {experiences.map((experience, index) => (
              <article className={`mission-card reveal ${experience.featured ? 'featured' : ''}`} key={experience.id}>
                <div className="mission-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="mission-content">
                  <p className="mini-label">{experience.eyebrow}</p>
                  <div className="mission-title-row">
                    <h3>{experience.organization}</h3>
                    <span>{experience.period}</span>
                  </div>
                  <p className="mission-role">{experience.role} · {experience.location}</p>
                  <p className="mission-summary">{experience.summary}</p>
                  <ul>
                    {experience.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                  </ul>
                </div>
                {experience.featured && experience.impact?.length && (
                  <div className="impact-orbit" aria-label="LiDRON engineering impact">
                    {experience.impact.map((impact) => (
                      <div key={`${impact.value}-${impact.label}`}><strong>{impact.value}</strong><span>{impact.label}</span></div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="projects-section chapter" id="projects" aria-labelledby="projects-title">
          <div className="section-heading reveal">
            <p className="chapter-index">03 — Selected projects</p>
            <h2 id="projects-title">Things I’ve built<br />while learning.</h2>
            <p className="section-deck">{portfolio.projectsIntro}</p>
          </div>

          <div className="project-constellation">
            {projects.map((project, index) => (
              <button
                className={`project-card accent-${project.accent} reveal`}
                id={`case-${project.id}`}
                type="button"
                key={project.id}
                onClick={(event) => openProject(project, event.currentTarget)}
                aria-haspopup="dialog"
              >
                <span className="project-card-top">
                  <span className="project-signal">{project.signal.split('/')[1]}</span>
                  <span className="project-index">0{index + 1}</span>
                </span>
                <strong>{project.name}</strong>
                <span className="project-period">{project.period}</span>
                <span className="project-stack" aria-label={`Built with ${project.stack.slice(0, 3).join(', ')}`}>
                  {project.stack.slice(0, 3).map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </span>
                <span className="project-open">View project <ArrowRight size={16} aria-hidden="true" /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="contact-section chapter" id="contact" aria-labelledby="contact-title">
          <div className="contact-copy reveal">
            <p className="chapter-index">04 — Get in touch</p>
            <h2 id="contact-title">Want to work<br />together?</h2>
            <p>{contact.intro}</p>
            <div className="contact-actions">
              <a className="primary-button" href={`mailto:${contact.email}`}>
                <Mail size={18} aria-hidden="true" /> Email me
              </a>
              <a className="contact-link" href={contact.linkedin} target="_blank" rel="noreferrer">
                <ContactRound size={18} aria-hidden="true" /> LinkedIn <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
            <a className="email-display" href={`mailto:${contact.email}`}>{contact.email}</a>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-mark"><Orbit aria-hidden="true" /> VS / 2026</div>
        <p>Designed and engineered in {portfolio.identity.location}.</p>
        <div className="footer-status"><span /> {portfolio.identity.status}</div>
      </footer>

      <ProjectDialog project={selectedProject} onClose={closeProject} />
    </div>
  )
}

export default App
