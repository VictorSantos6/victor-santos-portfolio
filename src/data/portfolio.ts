import portfolioJson from './portfolio.json'
import type { PortfolioContent, Project } from '../types'

export const defaultPortfolio = portfolioJson as PortfolioContent

export function normalizePortfolio(content: PortfolioContent): PortfolioContent {
  let changed = false
  const projects = content.projects.map((project) => {
    const legacyProject = project as Project & { status?: Project['status'] }
    if (legacyProject.status !== undefined) return project
    changed = true
    return { ...project, status: 'completed' as const }
  })

  return changed ? { ...content, projects } : content
}

export const {
  contact,
  education,
  experiences,
  projects,
  skillGroups,
} = defaultPortfolio
