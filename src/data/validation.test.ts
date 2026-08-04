import { describe, expect, it } from 'vitest'
import { defaultPortfolio } from './portfolio'
import { validatePortfolio } from './validation'

describe('portfolio content validation', () => {
  it('accepts the bundled portfolio seed', () => {
    expect(validatePortfolio(defaultPortfolio)).toEqual({})
  })

  it('rejects duplicate slugs and administrator-authored HTML', () => {
    const content = structuredClone(defaultPortfolio)
    content.projects[1].id = content.projects[0].id
    content.identity.summary = '<script>alert(1)</script>'

    expect(validatePortfolio(content)).toMatchObject({
      'projects.1.id': 'Each project ID must be unique.',
      'identity.summary': 'HTML is not allowed.',
    })
  })

  it('rejects non-HTTPS contact links and invalid project accents', () => {
    const content = structuredClone(defaultPortfolio)
    content.contact.linkedin = 'http://example.com/profile'
    content.projects[0].accent = 'red' as never

    expect(validatePortfolio(content)).toMatchObject({
      'contact.linkedin': 'Use a valid HTTPS URL.',
      'projects.0.accent': 'Choose an available accent.',
    })
  })
})
