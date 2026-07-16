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
import { contact, education, experiences, projects, skillGroups } from './data/portfolio'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useWebGL } from './hooks/useWebGL'
import { sectionThemes, themeCssVariables } from './theme'
import type { SectionId, ThemeCSSProperties } from './theme'
import type { Project } from './types'

const SpaceScene = lazy(() => import('./components/SpaceScene'))

const navigationItems = [
  { id: 'top', label: 'Intro' },
  { id: 'profile', label: 'Profile' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
] as const

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
  const appShell = useRef<HTMLDivElement>(null)
  const previousSection = useRef<SectionId>('top')
  const lastTrigger = useRef<HTMLButtonElement | null>(null)
  const activeTheme = sectionThemes[activeSection]

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
        duration: sectionChanged ? 1.2 : 0,
        ease: 'expo.inOut',
        overwrite: true,
      })

    }

    previousSection.current = activeSection

    return () => {
      gsap.killTweensOf(shell)
    }
  }, [activeSection, activeTheme, reducedMotion])

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
        <a className="brand" href="#top" aria-label="Victor Santos, back to top">
          <span className="brand-mark">VS</span>
          <span className="brand-copy">
            <strong>Victor Santos</strong>
            <small>CS &amp; Engineering student</small>
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
              CS &amp; Engineering student · UPRM
            </div>

            <div className="hero-copy reveal">
              <p className="chapter-index">00 — Introduction</p>
              <h1 id="hero-title">
                I build software
                <span>and learn by</span>
                <em>shipping it.</em>
              </h1>
              <p className="hero-summary">
                I’m Victor Santos, a Computer Science and Engineering student at UPRM. I build mobile apps with Flutter and Firebase, web projects, and research tools—often using AI-assisted coding to learn and iterate.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="#projects">
                  View my projects <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a className="text-link" href={contact.resume} download>
                  <Download size={17} aria-hidden="true" /> Download résumé
                </a>
              </div>
            </div>

            <div className="hero-telemetry reveal" aria-label="Current details">
              <div>
                <span>Building</span>
                <strong>Mobile, web, and research tools</strong>
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
            <p className="section-deck">My experience so far includes autonomous-systems research, Flutter development, and hands-on robotics.</p>
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
            <p className="chapter-index">03 — Selected projects</p>
            <h2 id="projects-title">Things I’ve built<br />while learning.</h2>
            <p className="section-deck">Open a project to see what I built, the tools I used, and the problem I was trying to solve.</p>
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
            <p>I’m looking for software engineering internships where I can contribute to real projects, learn from a team, and keep improving as a developer.</p>
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
        <p>Designed and engineered in Mayagüez, Puerto Rico.</p>
        <div className="footer-status"><span /> Open to internships</div>
      </footer>

      <ProjectDialog project={selectedProject} onClose={closeProject} />
    </div>
  )
}

export default App
