import type { PortfolioContent } from '../types'

export type ValidationErrors = Record<string, string>

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function requireText(errors: ValidationErrors, path: string, value: unknown, max = 500) {
  if (typeof value !== 'string' || !value.trim()) errors[path] = 'This field is required.'
  else if (value.length > max) errors[path] = `Keep this under ${max} characters.`
  else if (/[<>]/.test(value)) errors[path] = 'HTML is not allowed.'
}

function requireList(errors: ValidationErrors, path: string, value: unknown, maxItems = 50) {
  if (!Array.isArray(value)) {
    errors[path] = 'This must be a list.'
    return []
  }
  if (value.length > maxItems) errors[path] = `Use no more than ${maxItems} items.`
  return value
}

export function validatePortfolio(value: unknown): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!isRecord(value)) return { content: 'Portfolio content is invalid.' }

  const identity = value.identity
  if (!isRecord(identity)) errors.identity = 'Identity details are required.'
  else {
    for (const key of ['name', 'role', 'kicker', 'headlineLead', 'headlineMiddle', 'headlineEmphasis', 'summary', 'building', 'status', 'location']) {
      requireText(errors, `identity.${key}`, identity[key], key === 'summary' ? 1000 : 180)
    }
  }

  const education = value.education
  if (!isRecord(education)) errors.education = 'Education details are required.'
  else {
    for (const key of ['institution', 'location', 'degree', 'graduation', 'gpa']) requireText(errors, `education.${key}`, education[key], 240)
    requireList(errors, 'education.coursework', education.coursework, 30).forEach((item, index) => requireText(errors, `education.coursework.${index}`, item, 180))
  }

  const certifications = requireList(errors, 'certifications', value.certifications, 30)
  const certificationIds = new Set<string>()
  certifications.forEach((item, index) => {
    const base = `certifications.${index}`
    if (!isRecord(item)) return void (errors[base] = 'Certification is invalid.')
    for (const key of ['id', 'name', 'issuer', 'issued', 'detail', 'credentialId', 'verificationUrl', 'imageName']) {
      requireText(errors, `${base}.${key}`, item[key], key === 'verificationUrl' ? 500 : 240)
    }
    if (typeof item.id === 'string') {
      if (!slugPattern.test(item.id)) errors[`${base}.id`] = 'Use lowercase letters, numbers, and hyphens.'
      if (certificationIds.has(item.id)) errors[`${base}.id`] = 'Each certification ID must be unique.'
      certificationIds.add(item.id)
    }
    if (typeof item.verificationUrl === 'string') {
      try {
        if (new URL(item.verificationUrl).protocol !== 'https:') throw new Error()
      } catch {
        errors[`${base}.verificationUrl`] = 'Use a valid HTTPS URL.'
      }
    }
    if (item.imageKey !== null && typeof item.imageKey !== 'string') errors[`${base}.imageKey`] = 'Certificate image reference is invalid.'
  })

  requireText(errors, 'experienceIntro', value.experienceIntro, 1000)
  const experiences = requireList(errors, 'experiences', value.experiences, 30)
  const experienceIds = new Set<string>()
  experiences.forEach((item, index) => {
    const base = `experiences.${index}`
    if (!isRecord(item)) return void (errors[base] = 'Experience is invalid.')
    for (const key of ['id', 'organization', 'role', 'location', 'period', 'eyebrow', 'summary']) requireText(errors, `${base}.${key}`, item[key], key === 'summary' ? 1000 : 240)
    if (typeof item.id === 'string') {
      if (!slugPattern.test(item.id)) errors[`${base}.id`] = 'Use lowercase letters, numbers, and hyphens.'
      if (experienceIds.has(item.id)) errors[`${base}.id`] = 'Each experience ID must be unique.'
      experienceIds.add(item.id)
    }
    requireList(errors, `${base}.highlights`, item.highlights, 20).forEach((entry, itemIndex) => requireText(errors, `${base}.highlights.${itemIndex}`, entry, 500))
    if (item.impact !== undefined) {
      requireList(errors, `${base}.impact`, item.impact, 4).forEach((impact, impactIndex) => {
        if (!isRecord(impact)) errors[`${base}.impact.${impactIndex}`] = 'Impact is invalid.'
        else {
          requireText(errors, `${base}.impact.${impactIndex}.value`, impact.value, 30)
          requireText(errors, `${base}.impact.${impactIndex}.label`, impact.label, 80)
        }
      })
    }
  })

  requireText(errors, 'projectsIntro', value.projectsIntro, 1000)
  const projects = requireList(errors, 'projects', value.projects, 40)
  const projectIds = new Set<string>()
  projects.forEach((item, index) => {
    const base = `projects.${index}`
    if (!isRecord(item)) return void (errors[base] = 'Project is invalid.')
    for (const key of ['id', 'name', 'period', 'signal', 'problem', 'contribution']) requireText(errors, `${base}.${key}`, item[key], ['problem', 'contribution'].includes(key) ? 1200 : 240)
    if (typeof item.id === 'string') {
      if (!slugPattern.test(item.id)) errors[`${base}.id`] = 'Use lowercase letters, numbers, and hyphens.'
      if (projectIds.has(item.id)) errors[`${base}.id`] = 'Each project ID must be unique.'
      projectIds.add(item.id)
    }
    if (!['cyan', 'blue', 'amber', 'violet'].includes(String(item.accent))) errors[`${base}.accent`] = 'Choose an available accent.'
    requireList(errors, `${base}.stack`, item.stack, 20).forEach((entry, itemIndex) => requireText(errors, `${base}.stack.${itemIndex}`, entry, 80))
    requireList(errors, `${base}.outcomes`, item.outcomes, 20).forEach((entry, itemIndex) => requireText(errors, `${base}.outcomes.${itemIndex}`, entry, 300))
  })

  const skillGroups = requireList(errors, 'skillGroups', value.skillGroups, 20)
  skillGroups.forEach((item, index) => {
    const base = `skillGroups.${index}`
    if (!isRecord(item)) return void (errors[base] = 'Skill group is invalid.')
    requireText(errors, `${base}.label`, item.label, 80)
    requireList(errors, `${base}.skills`, item.skills, 30).forEach((entry, itemIndex) => requireText(errors, `${base}.skills.${itemIndex}`, entry, 80))
  })

  const contact = value.contact
  if (!isRecord(contact)) errors.contact = 'Contact details are required.'
  else {
    requireText(errors, 'contact.email', contact.email, 254)
    if (typeof contact.email === 'string' && !emailPattern.test(contact.email)) errors['contact.email'] = 'Enter a valid email address.'
    requireText(errors, 'contact.linkedin', contact.linkedin, 500)
    if (typeof contact.linkedin === 'string') {
      try {
        if (new URL(contact.linkedin).protocol !== 'https:') throw new Error()
      } catch {
        errors['contact.linkedin'] = 'Use a valid HTTPS URL.'
      }
    }
    if (contact.github !== undefined) {
      requireText(errors, 'contact.github', contact.github, 500)
      if (typeof contact.github === 'string') {
        try {
          const url = new URL(contact.github)
          if (url.protocol !== 'https:' || url.hostname !== 'github.com') throw new Error()
        } catch {
          errors['contact.github'] = 'Use a valid GitHub URL.'
        }
      }
    }
    requireText(errors, 'contact.intro', contact.intro, 1000)
    requireText(errors, 'contact.resumeName', contact.resumeName, 180)
    if (contact.resumeKey !== null && typeof contact.resumeKey !== 'string') errors['contact.resumeKey'] = 'Résumé reference is invalid.'
  }

  return errors
}

export function isPortfolioContent(value: unknown): value is PortfolioContent {
  return Object.keys(validatePortfolio(value)).length === 0
}
