import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import { ProjectGallery } from './ProjectGallery'

afterEach(cleanup)

it('leaves no gallery space for projects without photos', () => {
  const { container } = render(<ProjectGallery name="Demo" />)
  expect(container).toBeEmptyDOMElement()
})

it('supports arrows, keyboard navigation, and touch without opening project details', async () => {
  const user = userEvent.setup()
  render(<ProjectGallery name="Demo" images={['/one.webp', '/two.webp']} />)
  await user.click(screen.getByRole('button', { name: 'Next photo of Demo' }))
  expect(screen.getByRole('img')).toHaveAttribute('src', '/two.webp')
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('img')).toHaveAttribute('src', '/one.webp')
  const photo = screen.getByRole('img').parentElement!
  fireEvent.touchStart(photo, { touches: [{ clientX: 200, clientY: 100 }] })
  fireEvent.touchEnd(photo, { changedTouches: [{ clientX: 100, clientY: 105 }] })
  expect(screen.getByRole('img')).toHaveAttribute('src', '/two.webp')
})

it('skips unavailable images and hides controls when only one remains', () => {
  const { container } = render(<ProjectGallery name="Demo" images={['/one.webp', '/two.webp']} />)
  fireEvent.error(screen.getByRole('img'))
  expect(screen.getByRole('img')).toHaveAttribute('src', '/two.webp')
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  fireEvent.error(screen.getByRole('img'))
  expect(container).toBeEmptyDOMElement()
})
