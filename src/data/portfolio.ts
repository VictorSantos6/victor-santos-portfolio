import portfolioJson from './portfolio.json'
import type { PortfolioContent } from '../types'

export const defaultPortfolio = portfolioJson as PortfolioContent

export const {
  contact,
  education,
  experiences,
  projects,
  skillGroups,
} = defaultPortfolio
