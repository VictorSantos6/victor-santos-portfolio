import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Root from './Root'
import { defaultPortfolio } from './data/portfolio'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

describe('guarded admin entry', () => {
  it('opens the admin login after two VS brand activations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = String(input)
      return Promise.resolve({
        ok: true,
        json: async () => url.includes('/api/portfolio') ? defaultPortfolio : { authenticated: false },
      })
    }))
    const user = userEvent.setup()
    render(<Root />)

    const brand = screen.getByRole('link', { name: /victor santos, back to top/i })
    await user.click(brand)
    await user.click(brand)

    expect(await screen.findByRole('heading', { name: /portfolio admin/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveFocus()
  })

  it('keeps direct admin access behind the session check', async () => {
    window.history.replaceState(null, '', '/admin')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: false }),
    }))

    render(<Root />)

    await waitFor(() => expect(screen.getByRole('button', { name: /unlock editor/i })).toBeDisabled())
    expect(screen.queryByText(/private draft workspace/i)).not.toBeInTheDocument()
  })
})
