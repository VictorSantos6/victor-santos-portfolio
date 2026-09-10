import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultPortfolio } from '../data/portfolio'
import type { PortfolioRevision } from '../types'
import AdminApp from './AdminApp'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function response(payload: unknown, ok = true) {
  return Promise.resolve({ ok, json: async () => payload })
}

describe('portfolio admin editor', () => {
  it('loads the private draft, edits content, and saves explicitly', async () => {
    let current = structuredClone(defaultPortfolio)
    const revision = (): PortfolioRevision => ({ id: 2, content: current, updatedAt: '2026-08-04T12:00:00.000Z', publishedAt: null })
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/admin/session')) return response({ authenticated: true })
      if (url.endsWith('/api/admin/draft') && init?.method === 'PUT') {
        current = JSON.parse(String(init.body))
        return response({ revision: revision() })
      }
      if (url.endsWith('/api/admin/draft')) return response({ revision: revision() })
      return response({})
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<AdminApp />)

    const name = await screen.findByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'Victor S. Santos')
    const workingOn = screen.getByRole('textbox', { name: /^Working on/ })
    await user.clear(workingOn)
    await user.type(workingOn, 'LiDRON autonomous landing research')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => expect(screen.getAllByText('Draft saved.')).toHaveLength(2))
    expect(current.identity.name).toBe('Victor S. Santos')
    expect(current.identity.building).toBe('LiDRON autonomous landing research')
  })

  it('adds a project through the sectioned dashboard', async () => {
    const revision: PortfolioRevision = { id: 2, content: structuredClone(defaultPortfolio), updatedAt: '2026-08-04T12:00:00.000Z', publishedAt: null }
    vi.stubGlobal('fetch', vi.fn().mockImplementation((input: string | URL | Request) => response(String(input).endsWith('/session') ? { authenticated: true } : { revision })))
    const user = userEvent.setup()

    render(<AdminApp />)
    await screen.findByRole('heading', { name: 'General' })
    await user.click(screen.getByRole('button', { name: 'Projects' }))
    await user.click(screen.getByRole('button', { name: 'Add project' }))

    expect(screen.getByDisplayValue('New project')).toBeInTheDocument()
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  it('manages project images while keeping only Flash Cards seeded', async () => {
    let current = structuredClone(defaultPortfolio)
    const revision = (): PortfolioRevision => ({ id: 2, content: current, updatedAt: '2026-08-04T12:00:00.000Z', publishedAt: null })
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/admin/session')) return response({ authenticated: true })
      if (url.includes('/api/admin/project-image?id=esports-organizer') && init?.method === 'PUT') {
        current = structuredClone(current)
        current.projects.find((project) => project.id === 'esports-organizer')!.images = ['/api/project-image?key=project-images%2F00000000-0000-4000-8000-000000000000.png']
        return response({ revision: revision() })
      }
      if (url.endsWith('/api/admin/draft')) return response({ revision: revision() })
      return response({})
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<AdminApp />)
    await screen.findByRole('heading', { name: 'General' })
    await user.click(screen.getByRole('button', { name: 'Projects' }))

    expect(screen.getAllByAltText(/Flash Cards App screenshot/)).toHaveLength(6)
    expect(screen.getAllByText('No images for this project yet.')).toHaveLength(defaultPortfolio.projects.length - 1)

    const esportsCard = screen.getByRole('heading', { name: 'Esports Organizer' }).closest('.editor-card')!
    const input = esportsCard.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'results.png', { type: 'image/png' }))

    await waitFor(() => expect(screen.getByAltText('Esports Organizer screenshot 1')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/admin/project-image?id=esports-organizer'), expect.objectContaining({ method: 'PUT' }))
  })

  it('exposes the seeded certification for editing and can add another draft item', async () => {
    const revision: PortfolioRevision = { id: 2, content: structuredClone(defaultPortfolio), updatedAt: '2026-08-04T12:00:00.000Z', publishedAt: null }
    vi.stubGlobal('fetch', vi.fn().mockImplementation((input: string | URL | Request) => response(String(input).endsWith('/session') ? { authenticated: true } : { revision })))
    const user = userEvent.setup()

    render(<AdminApp />)
    await screen.findByRole('heading', { name: 'General' })
    await user.click(screen.getByRole('button', { name: 'Certifications' }))

    expect(screen.getByDisplayValue('Responsible Conduct of Research for Engineers')).toBeInTheDocument()
    expect(screen.getByDisplayValue('74865898')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add certification' }))
    expect(screen.getByDisplayValue('New certification')).toBeInTheDocument()
  })
})
