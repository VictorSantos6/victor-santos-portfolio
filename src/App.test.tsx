import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { sectionThemes, themeCssVariables } from './theme'

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
})

describe('portfolio experience', () => {
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

    expect(screen.getByRole('heading', { level: 1, name: /i build software and learn by shipping it/i })).toBeInTheDocument()
    expect(screen.getByText('LiDRON Research')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /victor\.santos6@upr\.edu/i })).toHaveAttribute(
      'href',
      'mailto:victor.santos6@upr.edu',
    )
    expect(screen.getByRole('link', { name: /download résumé/i })).toHaveAttribute(
      'href',
      '/resume',
    )
    expect(screen.getByRole('banner')).toHaveClass('site-header--hero')
    expect(screen.getByRole('link', { name: 'Intro' })).toHaveAttribute('aria-current', 'location')
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-planet', 'exoplanet')
    expect(document.querySelector('.css-space-fallback')).toBeInTheDocument()
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
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'Contact' }))

    expect(window.location.hash).toBe('#contact')
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-section', 'contact')
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-planet', 'moon')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'location')
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('opens the matching project when loaded from a project hash', () => {
    window.history.replaceState(null, '', '#project-space-invaders')
    render(<App />)

    expect(screen.getByRole('dialog', { name: /space invaders/i })).toBeInTheDocument()
    expect(screen.getByText(/without external libraries/i)).toBeInTheDocument()
  })
})
