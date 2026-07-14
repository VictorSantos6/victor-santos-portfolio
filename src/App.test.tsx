import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
})

describe('portfolio experience', () => {
  it('renders verified resume content and primary contact links', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /engineering systems that move/i })).toBeInTheDocument()
    expect(screen.getByText('LiDRON Research')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /victor\.santos6@upr\.edu/i })).toHaveAttribute(
      'href',
      'mailto:victor.santos6@upr.edu',
    )
    expect(screen.getByRole('link', { name: /download résumé/i })).toHaveAttribute(
      'href',
      '/Victor-Santos-Resume.pdf',
    )
    expect(screen.getByRole('banner')).toHaveClass('site-header--hero')
    expect(screen.getByRole('link', { name: 'Intro' })).toHaveAttribute('aria-current', 'location')
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
    expect(screen.getByText(/working without external libraries/i)).toBeInTheDocument()
  })
})
