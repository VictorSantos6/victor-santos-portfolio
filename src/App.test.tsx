import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import { planetPalettes, sectionThemes, themeCssVariables } from './theme'

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

    expect(planetPalettes.earth).toEqual(['#a2acb6', '#6d7b48', '#b18b74', '#161340', '#212d61'])
    expect(themeCssVariables(sectionThemes.profile)).toMatchObject({
      '--cyan': '#a2acb6',
      '--cta': '#6d7b48',
      '--theme-on-primary': '#161340',
      '--accent-rgb': '162, 172, 182',
      '--space-rgb': '22, 19, 64',
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

  it('opens the matching project when loaded from a project hash', () => {
    window.history.replaceState(null, '', '#project-space-invaders')
    render(<App />)

    expect(screen.getByRole('dialog', { name: /space invaders/i })).toBeInTheDocument()
    expect(screen.getByText(/without external libraries/i)).toBeInTheDocument()
  })
})
