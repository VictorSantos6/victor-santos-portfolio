import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  ContactRound,
  Download,
  ExternalLink,
  Mail,
  Orbit,
  Radar,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'
import { ProjectDialog } from './components/ProjectDialog'
import { contact, education, experiences, projects, skillGroups } from './data/portfolio'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useWebGL } from './hooks/useWebGL'
import type { Project } from './types'

const SpaceScene = lazy(() => import('./components/SpaceScene'))

const navigationItems = [
  { id: 'top', label: 'Intro' },
  { id: 'profile', label: 'Profile' },
  { id: 'experience', label: 'Missions' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
] as const

type SectionId = (typeof navigationItems)[number]['id']

function projectFromHash(): Project | null {
  const id = window.location.hash.replace('#project-', '')
  return projects.find((project) => project.id === id) ?? null
}

function App() {
  const reducedMotion = useReducedMotion()
  const webGLSupported = useWebGL()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSection, setActiveSection] = useState<SectionId>('top')
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => projectFromHash())
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 720px)').matches)
  const lastTrigger = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const syncHash = () => setSelectedProject(projectFromHash())
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const context = gsap.context(() => {
      if (!reducedMotion) {
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 48 },
            {
              autoAlpha: 1,
              y: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: element,
                start: 'top 88%',
                end: 'top 58%',
                scrub: 0.55,
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
            if (self.isActive) setActiveSection(id)
          },
        })
      })
    })

    return () => context.revert()
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

  const progressStyle = { '--scroll-progress': `${scrollProgress * 100}%` } as React.CSSProperties

  return (
    <div className="app-shell" style={progressStyle}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <div className="space-backdrop" aria-hidden="true">
        {webGLSupported ? (
          <Suspense fallback={<div className="scene-loader"><span /></div>}>
            <SpaceScene
              progress={scrollProgress}
              activeProjectId={selectedProject?.id ?? null}
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
        <a className="brand" href="#top" aria-label="Victor Santos, back to top">
          <span className="brand-mark">VS</span>
          <span className="brand-copy">
            <strong>Victor Santos</strong>
            <small>Systems in motion</small>
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
              Mission control / Mayagüez, PR
            </div>

            <div className="hero-copy reveal">
              <p className="chapter-index">00 — Introduction</p>
              <h1 id="hero-title">
                Engineering
                <span>systems that</span>
                <em>move.</em>
              </h1>
              <p className="hero-summary">
                I’m Victor Santos, a Computer Science &amp; Engineering student building resilient software, autonomous systems, and thoughtful digital products.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="#projects">
                  Explore the work <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a className="text-link" href={contact.resume} download>
                  <Download size={17} aria-hidden="true" /> Download résumé
                </a>
              </div>
            </div>

            <div className="hero-telemetry reveal" aria-label="Current telemetry">
              <div>
                <span>Focus</span>
                <strong>Software + autonomy</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>Open to internships</strong>
              </div>
              <div>
                <span>Graduation</span>
                <strong>May 2028</strong>
              </div>
            </div>
          </div>

          <a className="scroll-cue" href="#profile">
            <span>Begin trajectory</span>
            <ArrowDown size={16} aria-hidden="true" />
          </a>
        </section>

        <section className="profile-section chapter" id="profile" aria-labelledby="profile-title">
          <div className="section-heading reveal">
            <p className="chapter-index">01 — Flight profile</p>
            <h2 id="profile-title">Built to learn.<br />Ready to contribute.</h2>
          </div>

          <div className="profile-orbit">
            <article className="education-card glass-panel reveal">
              <div className="panel-icon"><BookOpen aria-hidden="true" /></div>
              <p className="mini-label">Education uplink</p>
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
              <small>Current trajectory</small>
            </article>

            <article className="course-card glass-panel reveal">
              <p className="mini-label">Course navigation</p>
              <ul>
                {education.coursework.map((course, index) => (
                  <li key={course}><span>0{index + 1}</span>{course}</li>
                ))}
              </ul>
            </article>

            <article className="skills-orbit glass-panel reveal">
              <p className="mini-label">Systems inventory</p>
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
            <p className="chapter-index">02 — Active missions</p>
            <h2 id="experience-title">From point clouds<br />to product flows.</h2>
            <p className="section-deck">Research, mobile engineering, and robotics—connected by a practical bias toward systems that work reliably.</p>
          </div>

          <div className="mission-stack">
            {experiences.map((experience, index) => (
              <article className={`mission-card reveal ${experience.featured ? 'featured' : ''}`} key={experience.id}>
                <div className="mission-number">M-{String(index + 1).padStart(2, '0')}</div>
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
                {experience.featured && (
                  <div className="impact-orbit" aria-label="LiDRON engineering impact">
                    <div><strong>50%</strong><span>faster iteration</span></div>
                    <div><strong>100%</strong><span>environment parity</span></div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="projects-section chapter" id="projects" aria-labelledby="projects-title">
          <div className="section-heading reveal">
            <p className="chapter-index">03 — Project constellation</p>
            <h2 id="projects-title">Four signals.<br />One evolving craft.</h2>
            <p className="section-deck">Select a transmission to inspect the challenge, contribution, and outcome.</p>
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
                <span className="project-open">Open case file <ArrowRight size={16} aria-hidden="true" /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="contact-section chapter" id="contact" aria-labelledby="contact-title">
          <div className="contact-radar reveal" aria-hidden="true">
            <Radar />
            <span /><span /><span />
          </div>
          <div className="contact-copy reveal">
            <p className="chapter-index">04 — Open channel</p>
            <h2 id="contact-title">Let’s build what’s<br />not here yet.</h2>
            <p>I’m looking for internship opportunities where thoughtful engineering, curiosity, and real-world impact share the same orbit.</p>
            <div className="contact-actions">
              <a className="primary-button" href={`mailto:${contact.email}`}>
                <Mail size={18} aria-hidden="true" /> Start a conversation
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
        <p>Designed and engineered in Mayagüez, Puerto Rico.</p>
        <div className="footer-status"><span /> Signal active</div>
      </footer>

      <ProjectDialog project={selectedProject} onClose={closeProject} />
    </div>
  )
}

export default App
