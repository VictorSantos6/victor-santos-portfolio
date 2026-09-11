import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { defaultPortfolio } from './data/portfolio'
import { sectionThemes, themeCssVariables } from './theme'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

describe('portfolio experience', () => {
  it('loads the published hero content from the admin-backed portfolio API', async () => {
    const publishedContent = structuredClone(defaultPortfolio)
    publishedContent.identity.building = 'LiDRON autonomous landing research'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => publishedContent,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App loadPublished />)

    expect(screen.getByText('LiDRON research and MiUni features')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('LiDRON autonomous landing research')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/api/portfolio', expect.objectContaining({ cache: 'no-store' }))
  })

  it('treats legacy published projects without statuses as completed', async () => {
    const publishedContent = structuredClone(defaultPortfolio)
    delete (publishedContent.projects[0] as Partial<(typeof publishedContent.projects)[number]>).status
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => publishedContent,
    }))
    const user = userEvent.setup()

    render(<App loadPublished />)

    await user.click(screen.getByRole('button', { name: 'Completed' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /flash cards app/i })).toBeInTheDocument())
  })

  it('maps every portfolio chapter to its planetary atmosphere', () => {
    expect(Object.fromEntries(
      Object.entries(sectionThemes).map(([section, theme]) => [section, theme.planet.variant]),
    )).toEqual({
      top: 'exoplanet',
      profile: 'earth',
      experience: 'mars',
      projects: 'neptune',
      contact: 'moon',
    })

    expect(themeCssVariables(sectionThemes.profile)).toMatchObject({
      '--cyan': '#d5d3c4',
      '--cta': '#978c67',
      '--accent-rgb': '213, 211, 196',
      '--space-rgb': '15, 22, 29',
    })

    expect(themeCssVariables(sectionThemes.experience)).toMatchObject({
      '--cyan': '#faf7eb',
      '--cta': '#fecb88',
      '--accent-rgb': '250, 247, 235',
      '--space-rgb': '93, 31, 30',
    })

    expect(themeCssVariables(sectionThemes.projects)).toMatchObject({
      '--cyan': '#a0e0c8',
      '--cta': '#74bfba',
      '--accent-rgb': '160, 224, 200',
      '--space-rgb': '13, 2, 28',
    })

    expect(themeCssVariables(sectionThemes.contact)).toMatchObject({
      '--cyan': '#e9e8ee',
      '--cta': '#b4b1b8',
      '--accent-rgb': '233, 232, 238',
      '--space-rgb': '16, 27, 57',
    })
  })

  it('renders verified resume content and primary contact links', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Victor Santos' })).toBeInTheDocument()
    expect(screen.getByText(/i build mobile apps/i)).toBeInTheDocument()
    expect(document.querySelector('.hero-summary')).not.toHaveTextContent(/AI-assisted coding/i)
    expect(screen.getByText('LiDRON Research')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /email me/i })).toHaveAttribute(
      'href',
      'mailto:victor.santos6@upr.edu',
    )
    expect(screen.queryByText('victor.santos6@upr.edu')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /download résumé/i })).toHaveAttribute(
      'href',
      '/Victor-Santos-Resume.pdf',
    )
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/VictorSantos6',
    )
    expect(screen.queryByText(defaultPortfolio.experienceIntro)).not.toBeInTheDocument()
    expect(screen.queryByText(defaultPortfolio.projectsIntro)).not.toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveClass('site-header--hero')
    expect(screen.getByRole('link', { name: 'Intro' })).toHaveAttribute('aria-current', 'location')
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-planet', 'exoplanet')
    expect(document.querySelector('.css-space-fallback')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Responsible Conduct of Research for Engineers certificate' })).toBeInTheDocument()
    expect(screen.getByText(/credential id 74865898/i)).toBeInTheDocument()
  })

  it('makes project evidence readable before the dialog opens', () => {
    render(<App />)

    const card = screen.getByRole('button', { name: /flash cards app/i })
    expect(card).toHaveTextContent(/simple study app/i)
    expect(card).toHaveTextContent(/built the Flutter app from scratch/i)
    expect(card).toHaveTextContent(/deck creation and flashcard editing/i)
    expect(document.querySelector('.space-backdrop')).toBeInTheDocument()
    expect(document.querySelector('.mission-rail')).not.toBeInTheDocument()
  })

  it('shows project statuses, keeps dates inside details, and filters the project grid', async () => {
    const content = structuredClone(defaultPortfolio)
    content.projects[1].status = 'in-progress'
    const user = userEvent.setup()

    render(<App initialContent={content} />)

    const flashCards = screen.getByRole('button', { name: /flash cards app/i })
    expect(flashCards).toHaveTextContent('Completed')
    expect(flashCards).not.toHaveTextContent('Jul 2025 — Aug 2025')

    await user.click(screen.getByRole('button', { name: 'In progress' }))
    expect(screen.getByRole('button', { name: /esports organizer/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /flash cards app/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /esports organizer/i }))
    expect(within(screen.getByRole('dialog', { name: /esports organizer/i })).getByText('Jul 2025 — Present')).toBeInTheDocument()
  })

  it('keeps empty status filters available with a helpful result', async () => {
    const user = userEvent.setup()
    render(<App />)

    const inProgress = screen.getByRole('button', { name: 'In progress' })
    expect(inProgress).toHaveAttribute('aria-pressed', 'false')
    await user.click(inProgress)

    expect(inProgress).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('No in-progress projects yet.')
  })

  it('uses the orbital stack only for certifications and opens a full-screen viewer', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Credentials in active orbit.' })).toBeInTheDocument()
    expect(screen.queryByText('Learning & credentials')).not.toBeInTheDocument()
    expect(screen.queryByText('Computer Science & Engineering', { selector: '.learning-stack-card strong' })).not.toBeInTheDocument()
    const certificateCard = screen.getByRole('button', { name: 'Open Responsible Conduct of Research for Engineers certificate' })
    expect(certificateCard).toHaveAttribute('aria-current', 'true')

    await user.click(certificateCard)

    const viewer = screen.getByRole('dialog', { name: 'Responsible Conduct of Research for Engineers' })
    expect(viewer).toBeInTheDocument()
    expect(viewer.parentElement?.parentElement).toHaveClass('app-shell')
    expect(within(viewer).getByRole('img')).toHaveAttribute('src', '/certifications/responsible-conduct-research-engineers.webp')
    expect(within(viewer).getByRole('link', { name: 'Verify' })).toHaveAttribute('href', defaultPortfolio.certifications[0].verificationUrl)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Responsible Conduct of Research for Engineers' })).not.toBeInTheDocument())
    await waitFor(() => expect(certificateCard).toHaveFocus())
  })

  it('opens project cases through a deep-linkable dialog and closes with Escape', async () => {
    const user = userEvent.setup()
    render(<App />)

    const projectButton = screen.getByRole('button', { name: /flash cards app/i })
    await user.click(projectButton)

    expect(window.location.hash).toBe('#project-flash-cards')
    expect(screen.getByRole('dialog', { name: /flash cards app/i })).toBeInTheDocument()
    expect(screen.getByText(/offline persistence with hive/i)).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(window.location.hash).toBe('#projects')
    await waitFor(() => expect(projectButton).toHaveFocus())
  })

  it('targets a selected chapter immediately without waiting for intermediate scroll triggers', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo')
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'Contact' }))

    expect(window.location.hash).toBe('#contact')
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-section', 'contact')
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-planet', 'moon')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'location')
    await waitFor(() => expect(scrollTo).toHaveBeenCalled())
  })

  it('jumps without animation when reduced motion is requested', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }))
    const scrollTo = vi.spyOn(window, 'scrollTo')
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'Contact' }))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-section', 'contact')
  })

  it('opens the matching project when loaded from a project hash', () => {
    window.history.replaceState(null, '', '#project-space-invaders')
    render(<App />)

    const dialog = screen.getByRole('dialog', { name: /space invaders/i })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText(/without external libraries/i)).toBeInTheDocument()
  })
})
